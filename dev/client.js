const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const path = require('path');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.listen(3001, () => {
    console.log('listening on *:3001');
  });
  