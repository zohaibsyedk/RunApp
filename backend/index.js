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

const WEB_URL = 'https://runapp-472401.web.app';

app.get('/', (req, res) => {
  res.send('Hello from your Node.js backend on GCP! 👋');
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(), //required
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), //required
    };

    const eventRef = await firestore.collection('events').add(eventData);

    return res.status(201).json({
      success: true,
      message: "Event document created successfully.",
      event: { id: eventRef.id, ...eventData},
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ error: "An unexpected error occured." });
  }
});

const enrichEventWithOrgData = async (event) => {
  let orgPhotoURL = null;
  let orgName = null;

  try {
    if (event.organizationId === event.createdBy) {
      const userDoc = await firestore.collection('users').doc(event.createdBy).get();
      if (userDoc.exists) {
        orgPhotoURL = userDoc.data().photoURL;
        orgName = userDoc.data().displayName;
      }
    } else if (event.organizationId) {
      const orgDoc = await firestore.collection('organizations').doc(event.organizationId).get();
      if (orgDoc.exists) {
        orgPhotoURL = orgDoc.data().organizationPhotoURL;
        orgName = orgDoc.data().name;
      }
    }
  } catch (err) {
    console.error(`Failed to enrich event ${event.id}:`, err);
  }

  return {
    ...event,
    organizationPhotoURL: orgPhotoURL || 'https://placehold.co/100x100/EEE/31343C?text=Org',
    organizationName: orgName
  };
};

app.get('/api/events', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { filter } = req.query;
    const eventsCollection = firestore.collection('events');

    let rawEvents = [];

    switch (filter) {
      case 'mine': {
        console.log(`Fetching events for user: ${userId}`);
        const query = eventsCollection.where('createdBy', '==', userId);
        const snapshot = await query.get();
        rawEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      }
      case 'public': {
        console.log('Fetching all public events');
        const query = eventsCollection.where('visibility', '==', 'Public');
        const snapshot = await query.get();
        rawEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      }
      case 'public_not_mine': {
        console.log(`Fetching public events not created by user: ${userId}`);
        const query = eventsCollection.where('visibility', '==', 'Public').where('createdBy', '!=', userId);
        const snapshot = await query.get();
        rawEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      }
      default: { // 'all' events
        console.log(`Fetching all events accessible by user: ${userId}`);
        const publicEventsSnapshot = await eventsCollection.where('visibility', '==', 'Public').get();
        const userEventsSnapshot = await eventsCollection.where('createdBy', '==', userId).get();

        const combinedEventsMap = new Map();
        publicEventsSnapshot.forEach(doc => combinedEventsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        userEventsSnapshot.forEach(doc => combinedEventsMap.set(doc.id, { id: doc.id, ...doc.data() }));

        rawEvents = Array.from(combinedEventsMap.values());
        break;
      }
    }

    const enrichedEvents = await Promise.all(
      rawEvents.map(event => enrichEventWithOrgData(event))
    );

    enrichedEvents.sort((a, b) => b.startDate.toMillis() - a.startDate.toMillis());

    return res.status(200).json({
      success: true,
      message: `Events Successfully Retrieved with filter: ${filter || 'all'}`,
      events: enrichedEvents
    });

  } catch (error) {
    console.error("Error fetching events", error);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
});

app.post('/api/organizations', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, organizationPhotoURL, visibility, description } = req.body;

    if (!name || !organizationPhotoURL || !visibility) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const organizationData = {
      name: name, //required
      organizationPhotoURL: organizationPhotoURL, //required
      visibility: visibility, //required
      createdBy: userId, //required
      description: description || '', //optional
      memberCount: 1, //required
      createdAt: admin.firestore.FieldValue.serverTimestamp(), //required
      updatedAt: admin.firestore.FieldValue.serverTimestamp() //required
    };

    const organizationRef = await firestore.collection('organizations').add(organizationData);

    return res.status(201).json({
      success: true,
      message: "Organization document created successfully.",
      organization: { id: organizationRef.id, ...organizationData},
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ error: "An unexpected error occured." });
  }
});

app.get('/api/organizations', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { filter } = req.query;

    const orgsCollection = firestore.collection('organizations');
    let orgsQuery;

    switch (filter) {
      case 'public':
        orgsQuery = orgsCollection.where('visibility', '==', 'Public');
        break;
      default: //default to 'mine'
        orgsQuery = orgsCollection.where('createdBy', '==', userId);
        break;
    }

    const snapshot = await orgsQuery.get();
    const organizations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    organizations.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      success: true,
      message: `Organizations successfully retrieved with filter: ${filter || 'mine'}`,
      organizations: organizations
    });
  } catch (error) {
    console.error("Error fetching organizations", error);
    return res.status(500).json({ error: "An unexpected error occurred while fetching organizations." });
  }
});
app.post('/api/events/:eventId/sessions', verifyFirebaseToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.uid;
    const { startTime } = req.body;

    const sessionData = {
      eventId: eventId,
      userId: userId,
      status: 'registered',
      startTime: startTime,
      endTime: null,
      elapsedTimeSeconds: null,
      locations: [],
      elapsedDistanceMeters: 0,
      lastKnownLocation: null
    }

    const sessionRef = await firestore.collection('eventSessions').add(sessionData);

    return res.status(200).json({
      success: true,
      message: 'Session successfully created',
      session: { id: sessionRef.id, ...sessionData },
      shareableLink: `${WEB_URL}/share/${sessionRef.id}`
    });
  } catch (error) {
    console.error("Error creating session", error);
    return res.status(500).json({ error: "An unexpected error occurred while creating the session." });
  }
});

app.get('/api/events/:eventId/sessions', verifyFirebaseToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.uid;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required.' });
    }

    const eventSessionsCollection = firestore.collection('eventSessions');

    const sessionQuery = eventSessionsCollection
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .limit(1);

    const snapshot = await sessionQuery.get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Session not found. User has not joined this event.'
      });
    }

    const sessionDoc = snapshot.docs[0];
    const sessionData = {
      id: sessionDoc.id,
      ...sessionDoc.data()
    };

    return res.status(200).json({
      success: true,
      message: 'Session successfully retrieved.',
      session: sessionData
    });
  } catch (error) {
    console.error("Error fetching user session", error);
    return res.status(500).json({ error: "An unexpected error occurred while fetching the session."});
  }
});

app.post('/api/events/:eventId/start', verifyFirebaseToken, async (req, res) => {
  console.log('unfinished event start');
});

function getDistance(lat1, lon1, lat2, lon2) {
  console.log('getting distance');
  const R = 6371;
  const toRad = (value) => (value*Math.PI) / 180;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c;
  console.log('distance: '+distance);
  return distance;
}

function calculateIncrementalDistance(sortedLocations, lastLocation) {
  console.log('calculating incremental distance');
  let distanceThisBatchKm = 0;
  let currentLastLocation = lastLocation;
  
  const JITTER_THRESHOLD_METERS = 1.0; 

  sortedLocations.forEach(loc => {
    if (currentLastLocation) {
      const lat1 = currentLastLocation.geopoint.latitude;
      const lon1 = currentLastLocation.geopoint.longitude;
      const lat2 = loc.geopoint.latitude;
      const lon2 = loc.geopoint.longitude;
      
      const segmentDistanceKm = getDistance(lat1, lon1, lat2, lon2);
      if (segmentDistanceKm * 1000 > JITTER_THRESHOLD_METERS) {
        distanceThisBatchKm += segmentDistanceKm;
      }
    }
    currentLastLocation = loc; // The last point becomes the next start point
  });

  return { distanceThisBatchKm, lastLocationInBatch: currentLastLocation };
}

app.post('/api/sessions/:sessionId/update', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('updating session');
    const userId = req.user.uid;
    const { sessionId } = req.params;
    const { locations, elapsedTimeSeconds } = req.body;

    if (!locations || !Array.isArray(locations) || locations.length === 0 || elapsedTimeSeconds === undefined) {
      return res.status(400).json({ error: 'Missing or invalid locations or elapsedTimeSeconds.'});
    }

    const sessionRef = firestore.collection('eventSessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(400).json({ error: 'Session not found.' });
    }

    const sessionData = sessionDoc.data();

    if (sessionData.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this session.' });
    }

    if (sessionData.status !== 'active') {
      return res.status(400).json({ error: 'This session is no longer active.' });
    }

    const currentDistanceMeters = sessionData.elapsedDistanceMeters || 0;
    const lastKnownLocation = sessionData.lastKnownLocation || null;

    const newLocationPoints = locations.map(loc => {
      return {
        geopoint: new admin.firestore.GeoPoint(loc.latitude, loc.longitude),
        timestamp: new Date(loc.timestamp)
      };
    });
    newLocationPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const { distanceThisBatchKm, lastLocationInBatch } = calculateIncrementalDistance(newLocationPoints, lastKnownLocation);
    const distanceThisBatchMeters = distanceThisBatchKm * 1000;
    const newTotalDistanceMeters = currentDistanceMeters + distanceThisBatchMeters;


    const updateData = {
      locations: admin.firestore.FieldValue.arrayUnion(...newLocationPoints),
      elapsedTimeSeconds: elapsedTimeSeconds,
      elapsedDistanceMeters: newTotalDistanceMeters,
      lastKnownLocation: lastLocationInBatch,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await sessionRef.update(updateData);


    return res.status(200).json({
      success: true,
      message: `Session ${sessionId} updated successfully`,
      totalDistanceMeters: newTotalDistanceMeters
    });
  } catch (error) {
    console.error("Error updating session", error);
    res.status(500).json({ error: "An unexpected error occured when updating the session."});
  }
});

app.post('/api/sessions/:sessionId/stop', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { sessionId } = req.params;
    const { locations, elapsedTimeSeconds } = req.body;

    const sessionRef = firestore.collection('eventSessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const sessionData = sessionDoc.data();

    if (sessionData.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to stop this session.' });
    }

    if (sessionData.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Session was already completed.'
      });
    }

    const finalUpdateData = {
      status: 'completed',
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (elapsedTimeSeconds !== undefined) {
      finalUpdateData.elapsedTimeSeconds = elapsedTimeSeconds;
    }

    if (locations && Array.isArray(locations) && locations.length > 0) {
      const currentDistanceMeters = sessionData.elapsedDistanceMeters || 0;
      const lastKnownLocation = sessionData.lastKnownLocation || null;

      const newLocationPoints = locations.map(loc => ({
        geopoint: new admin.firestore.GeoPoint(loc.latitude, loc.longitude),
        timestamp: new Date(loc.timestamp)
      }));
      newLocationPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const { distanceThisBatchKm, lastLocationInBatch } = calculateIncrementalDistance(newLocationPoints, lastKnownLocation);
      const distanceThisBatchMeters = distanceThisBatchKm * 1000;
      const newTotalDistanceMeters = currentDistanceMeters + distanceThisBatchMeters;

      finalUpdateData.locations = admin.firestore.FieldValue.arrayUnion(...newLocationPoints);
      finalUpdateData.elapsedDistanceMeters = newTotalDistanceMeters;
      finalUpdateData.lastKnownLocation = lastLocationInBatch;
    }

    await sessionRef.update(finalUpdateData);

    return res.status(200).json({
      success: true,
      message: `Session ${sessionId} has been stopped.`
    });
  } catch (error) {
    console.error('Error stopping session', error);
    res.status(500).json({ error: 'An unexpected error occured while stopping the session.'});
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
    const sessionId = shareId;
    const extension = audioFile.originalname && audioFile.originalname.includes('.')
      ? audioFile.originalname.substring(audioFile.originalname.lastIndexOf('.') + 1)
      : 'mp3';
    const objectPath = `audio/${sessionId}/message_${messageId}.${extension}`;

    const file = bucket.file(objectPath);
    await file.save(audioFile.buffer, {
      contentType: audioFile.mimetype || 'audio/mpeg',
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });

    const docRef = firestore.doc(`voiceMessages/message_${messageId}`);
    await docRef.set({
      messageId,
      sessionId,
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