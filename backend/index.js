const express = require('express');
const multer = require('multer');
const app = express();
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

const upload = multer({ storage: multer.memoryStorage() });
// Basic middleware
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

app.get('/', (req, res) => {
  res.send('Hello from your Node.js backend on GCP! 👋');
});

app.post('/strava/exchange', async (req, res) => {
  try {
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


//unfinished
app.post('/api/events', async (req, res) => {
  try {
    const submissionData = req.body;
    console.log('Received /api/events payload:', submissionData);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Error processing /api/events', err);
    return res.status(500).json({ error: 'Internal server error' });
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

    // No signed URLs or public ACLs needed; we store only the object path

    // Store metadata in Firestore as per schema
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