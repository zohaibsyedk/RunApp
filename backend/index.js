const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// The PORT environment variable is provided by Cloud Run.
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Hello from your Node.js backend on GCP! 👋');
});

// Exchange Strava auth code for tokens
// Expects: { code: string, redirectUri: string }
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

    // Optionally store tokens here
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});