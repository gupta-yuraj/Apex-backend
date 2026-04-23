const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));

// Application Schema
const applicationSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: { type: String, unique: true },
  phone: String,
  college: String,
  year: String,
  resume: String,
  message: String,
  status: { type: String, default: 'Pending' },
  appliedAt: String
});

const Application = mongoose.model('Application', applicationSchema);

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'Server running' });
});

// Submit application
app.post('/api/apply', async (req, res) => {
  try {
    const { name, email, phone, college, year, resume, message } = req.body;

    if (!name || !email || !phone || !college || !year || !resume) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existing = await Application.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already applied' });
    }

    const newApp = new Application({
      id: uuidv4(),
      name, email, phone, college, year, resume,
      message: message || '',
      status: 'Pending',
      appliedAt: new Date().toLocaleString()
    });

    await newApp.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { id: newApp.id, status: newApp.status }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all applications
app.get('/api/applications', async (req, res) => {
  try {
    const applications = await Application.find().sort({ _id: -1 });
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update status
app.patch('/api/applications/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Reviewing', 'Interview', 'Rejected', 'Hired'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const app = await Application.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    );

    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: app });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete application
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const app = await Application.findOneAndDelete({ id: req.params.id });
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});