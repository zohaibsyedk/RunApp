const express = require('express');
const multer = require('multer');
const app = express();
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { decode } = require('jsonwebtoken');

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const port = process.env.PORT || 8080;

if (!admin.apps.length) {
  admin.initializeApp();
}
const firestore = admin.firestore();
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET || `${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
const bucket = storage.bucket(bucketName);

const webhookSubscriptions = new Map();

app.post('/strava/webhook/setup', async (req, res) => {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID ? process.env.STRAVA_CLIENT_ID.trim() : null;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET ? process.env.STRAVA_CLIENT_SECRET.trim() : null;
    const callbackUrl = 'https://run-app-backend-179019793982.us-central1.run.app/strava/webhook';

    console.log('🔧 Webhook setup started', {
      clientId: clientId ? '***' + clientId.slice(-4) : 'MISSING',
      clientSecret: clientSecret ? '***' + clientSecret.slice(-4) : 'MISSING',
      callbackUrl: callbackUrl
    });

    if (!clientId || !clientSecret || !callbackUrl) {
      return res.status(200).json({ error: 'Missing Strava configuration' });
    }
    console.log('fetching response');
    const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        callback_url: callbackUrl,
        verify_token: 'verification_token_2134haw2195218sadh213124512f2121'
      })
    });

    const data = await response.json();
    console.log('data:', data);

    if (!response.ok) {
      return res.status(400).json({
        error: 'Failed to create webhook subscription',
        details: data
      });
    }

    console.log("Webhook subscription created", data);

    await firestore.collection('config').doc('webhook').set({
      subscriptionId: data.id,
      createdAt: new Date().toISOString(),
      callbackUrl: callbackUrl
    });

    return res.json({
      success: true,
      message: 'Webhook subscription created successfully',
      subscription: data
    });


  } catch (err) {
    console.error('Webhook subscription error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const WEBHOOK_VERIFY_TOKEN = 'verification_token_2134haw2195218sadh213124512f2121';

app.get('/strava/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request received');

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('SUCCESS: Webhook has been verified');
    res.json({ 'hub.challenge': challenge });
  } else {
    console.error('ERROR: Verification token mismatch');
    res.sendStatus(403);
  }
});

app.post('/strava/webhook', async (req, res) => {
  try {
    res.status(200).send('EVENT_RECEIVED');

    if (req.body && req.body.object_type === 'activity') {
      const { object_id, owner_id, aspect_type, updates } = req.body;

      console.log(`Activity Update for athlete ${owner_id}:`, {
        activityId: object_id,
        updateType: aspect_type,
        updates: updates
      });

      await handleActivityUpdate(owner_id, object_id, updates);
    }
  } catch (err) {
    // Log errors, but don't send a 500 status to Strava.
    // Strava considers any non-200 response a failure and will retry.
    console.error('Webhook processing error:', err);
  }
});

async function handleActivityUpdate(athleteId, activityId, updates) {
  try {
    console.log(`Processing update for athlete ${athleteId}, activity ${activityId}`);
    const activeSessions = await firestore.collection('monitoringSessions')
      .where('athleteId', '==', athleteId.toString())
      .where('status', '==', 'active')
      .get();
    
      if (activeSessions.empty) {
        console.log(`No active sessions for athlete ${athleteId}`);
        return;
      }

      for (const sessionDoc of activeSessions.docs) {
        const session = sessionDoc.data();
        await processSessionUpdate(session, activityId, updates);
      }
  } catch (err) {
    console.error('Error handling activity update:', err);
  }
}

async function processSessionUpdate(session, activityId, updates) {
  const { eventId, mileMarkers = [], triggeredMarkers = [] } = session;

  if (session.activityId !== activityId.toString()) {
    return;
  }

  if (updates && updates.distance) {
    const distanceMiles = updates.distance / 1609.34;
    console.log(`Athlete ${session.athleteId}: ${distanceMiles.toFixed(2)} miles`)
  }
}

app.get('/', (req, res) => {
  res.send('Hello from your Node.js backend on GCP! 👋');
});

app.post('/strava/exchange', async (req, res) => {
  try {
    console.log('exchange');
    const { code, redirectUri } = req.body || {};
    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Missing code or redirectUri' });
    }

    const clientId = process.env.STRAVA_CLIENT_ID ? process.env.STRAVA_CLIENT_ID.trim() : null;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET ? process.env.STRAVA_CLIENT_SECRET.trim() : null;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Server not configured for Strava' });
    }

    const tokenResp = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenResp.json();
    if (!tokenResp.ok) {
      return res.status(tokenResp.status).json({ error: 'Strava token exchange failed', details: data });
    }

    return res.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athlete: data.athlete,
    });
  } catch (err) {
    console.error('Exchange error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/strava/uploads', async (req, res) => {
  try {
    const { accessToken, activityData } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: "Access Token Required" });
    }
    if (!activityData || !activityData.file || !activityData.name || !activityData.data_type || !activityData.external_id) {
      return res.status(400).json({
        error: 'Missing required activity data',
        required: [ 'file', 'name', 'description', 'data_type', 'external_id'],
        optional: [ 'description' ]
      })
    }
    const stravaActivity = {
      file: activityData.file,
      name: activityData.name,
      description: activityData.description || '',
      data_type: activityData.data_type,
      external_id: activityData.external_id
    };

    const response = await fetch('https://www.strava.com/api/v3/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stravaActivity)
    });
  }
  catch (err) {
    console.error('Error creating uploading run data: ', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/strava/activites', async (req, res) => {
  try {
    const { accessToken, activityData } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: "Access Token Required" });
    }
    if (!activityData || !activityData.name || !activityData.type) {
      return res.status(400).json({
        error: "Missing required activity data",
        required: [ 'name', 'type'],
        optional: ['description', 'distance', 'elapsed_time', 'start_date_local']
      });
    }

    //ready for strava fetch
    const stravaActivity = {
      //required fields
      name: activityData.name,
      type: activityData.type,
      sport_type: activityData.sport_type || activityData.type,
      //optional fields
      start_date_local: activityData.start_date_local || new Date().toISOString(),
      elapsed_time: activityData.elapsed_time || 0,
      description: activityData.description || '',
      distance: activityData.distance || 0.0,
      trainer: activityData.trainer || 0,
      commute: activityData.commute || 0
    };

    const response = await fetch('https://www.strava.com/api/v3/activities', {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stravaActivity)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Strava API error:', data);
      return res.status(response.status).json({ 
        error: 'Failed to create activity on Strava', 
        details: data 
      });
    }

    return res.json({
      success: true,
      activity: data,
      message: "Activity created successfully on Strava"
    });

  } catch (err) {
    console.error('Error creating Strava activity:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).send('Unauthorized: No token provided');
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized: Invalid token');
  }
};

app.post('/api/users', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    const { displayName, photoURL } = req.body;

    const userData = {
      uid,
      email,
      displayName: displayName || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      photoURL: photoURL,
      accountType: 'Runner',
      organizations: [displayName],
    };

    await firestore.collection('users').doc(uid).set(userData);
    console.log(`User doc created for UID: ${uid}`);
    
    return res.status(201).json({
      success: true,
      message: "User document created successfully.",
      user: userData,
    })
  } catch (e) {
    console.error("Error creating user doc",e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/events', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, organizationId, startDate, visibility, distance, location, description } = req.body;

    if (!name || !organizationId || !startDate || !visibility) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const eventData = {
      name: name, //required
      organizationId: organizationId, //required
      createdBy: userId, //required
      startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)), //required
      visibility: visibility, //required
      distance: distance || 0, //optional
      description: description || '', //optional
      location: { //optional
        "address": location.address || "",
        "geopoint": new admin.firestore.GeoPoint(
          location?.geopoint?.latitude || 0,
          location?.geopoint?.longitude || 0
        )
      },
      "createdAt": admin.firestore.FieldValue.serverTimestamp(), //required
      "updatedAt": admin.firestore.FieldValue.serverTimestamp(), //required
    };

    const eventRef = await firestore.collection('events').add(eventData);

    return res.status(201).json({
      success: true,
      message: "Event document created successfully.",
      event: { id: eventRef.id, ...eventData},
    })
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ error: "An unexpected error occured." });
  }
});

app.get('/api/events', verifyFirebaseToken, async (req, res) => {
  //fetches user events and public events (will add friends later) and sorts by startDate
  try {
    const userId = req.user.uid;

    const publicEventsQuery = firestore.collection('events').where('visibility', '==', 'Public');
    const publicEventsSnapshot = await publicEventsQuery.get();
    const publicEvents = [];
    publicEventsSnapshot.forEach(doc => {
      publicEvents.push({ id: doc.id, ...doc.data()});
    });

    const userEventsQuery = firestore.collection('events').where('createdBy', '==', userId);
    const userEventsSnapshot = await userEventsQuery.get();
    const userEvents = [];
    userEventsSnapshot.forEach(doc => {
      userEvents.push({ id: doc.id, ...doc.data()});
    });
    console.log("Public Events:", publicEvents);
    console.log("User Events:", userEvents);
    const combinedEventsMap = new Map();
    publicEvents.forEach(event => combinedEventsMap.set(event.id, event));
    userEvents.forEach(event => combinedEventsMap.set(event.id, event));

    const finalEvents = Array.from(combinedEventsMap.values());
    console.log(finalEvents);
    finalEvents.sort((a,b) => b.startDate.toMillis() - a.startDate.toMillis());

    return res.status(200).json({
      success: true,
      message: "Events Successfully Retrieved",
      events: finalEvents
    });
  } catch (error) {
    console.error("Error fetching events", error);
    return res.status(500).json({ error: "An unexpected error occurred."});
  }
});

app.post('/api/events/:shareId/upload', upload.single('audioFile'), async (req, res) => {
  try {
    const { shareId } = req.params;
    const { senderName, triggerType, triggerValue } = req.body || {};
    const audioFile = req.file;

    if (!shareId) {
      return res.status(400).json({ error: 'Missing shareId' });
    }

    if (!senderName || !triggerType || !triggerValue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const messageId = Date.now().toString();
    const eventId = `event_${shareId}`;
    const extension = audioFile.originalname && audioFile.originalname.includes('.')
      ? audioFile.originalname.substring(audioFile.originalname.lastIndexOf('.') + 1)
      : 'mp3';
    const objectPath = `audio/${eventId}/message_${messageId}.${extension}`;

    const file = bucket.file(objectPath);
    await file.save(audioFile.buffer, {
      contentType: audioFile.mimetype || 'audio/mpeg',
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });

    const docRef = firestore.doc(`voiceMessages/message_${messageId}`);
    await docRef.set({
      messageId,
      eventId,
      senderName,
      audioFileUrl: objectPath,
      triggerType,
      triggerValue: triggerType === 'distance' ? parseFloat(triggerValue) : parseInt(triggerValue, 10),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ status: 'ok', messageId, eventId, audioFileUrl: objectPath });
  } catch (err) {
    console.error('Error handling upload', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});