const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const apps = [];

app.post('/api/apply', (req, res) => {
    console.log('Received:', req.body);
    apps.push(req.body);
    res.json({ success: true, total: apps.length });
});

app.get('/api/applications', (req, res) => {
    res.json(apps);
});

app.listen(PORT, () => {
    console.log(`Server on http://localhost:${PORT}`);
    console.log(`Test: curl -X POST http://localhost:${PORT}/api/apply -H "Content-Type: application/json" -d '{"name":"test"}'`);
});