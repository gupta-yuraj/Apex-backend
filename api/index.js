const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const applications = [];

app.get('/', (req, res) => res.json({ status: 'ok', count: applications.length }));

app.post('/apply', (req, res) => {
    applications.push(req.body);
    res.json({ success: true });
});

app.get('/applications', (req, res) => res.json(applications));

module.exports = app;