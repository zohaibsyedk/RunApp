const express = require('express');
const app = express();

// The PORT environment variable is provided by Cloud Run.
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Hello from your Node.js backend on GCP! 👋');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});