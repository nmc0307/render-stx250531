const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000

app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

app.get('/api', (req, res) => {
  res.json({ message: 'Hello API!' });
});

app.get('/callback', (req, res) => {
  res.send('This is the callback endpoint!');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
