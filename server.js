const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;

// ✅ Replace with your actual Vercel frontend URL after deploying frontend
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const applications = [];

// Health check
app.get('/api', (req, res) => {
    res.json({ 
        status: 'Server running', 
        totalApplications: applications.length 
    });
});

// Temporary GET for testing
app.get('/api/apply', (req, res) => {
    res.json({ 
        message: 'This is a POST endpoint. Use POST to submit applications.',
        currentApplications: applications.length 
    });
});

// Submit application
app.post('/api/apply', (req, res) => {
    try {
        const { name, email, phone, college, year, resume, message } = req.body;

        console.log('Received application:', { name, email, college });

        if (!name || !email || !phone || !college || !year || !resume) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        const existing = applications.find(app => app.email === email);
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'Application with this email already exists'
            });
        }

        const newApplication = {
            id: uuidv4(),
            name,
            email,
            phone,
            college,
            year,
            resume,
            message: message || '',
            status: 'Pending',
            appliedAt: new Date().toLocaleString()
        };

        applications.push(newApplication);
        console.log('Total applications:', applications.length);

        setTimeout(() => {
            res.status(201).json({
                success: true,
                message: 'Application submitted successfully',
                data: { id: newApplication.id, status: newApplication.status }
            });
        }, 800);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get all applications
app.get('/api/applications', (req, res) => {
    const sorted = [...applications].sort((a, b) => 
        new Date(b.appliedAt) - new Date(a.appliedAt)
    );
    res.json({ success: true, count: sorted.length, data: sorted });
});

// Update status
app.patch('/api/applications/:id', (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Reviewing', 'Interview', 'Rejected', 'Hired'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const app = applications.find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });

    app.status = status;
    res.json({ success: true, data: app });
});

// Delete application
app.delete('/api/applications/:id', (req, res) => {
    const idx = applications.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    
    applications.splice(idx, 1);
    res.json({ success: true });
});

// Admin dashboard
app.get('/admin', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>ApexCore - Applications</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; background: #f1f5f9; padding: 20px; }
            .container { max-width: 1400px; margin: 0 auto; }
            h1 { color: #1e3a8a; margin-bottom: 10px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .stat-box { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .stat-box h3 { font-size: 12px; color: #64748b; text-transform: uppercase; }
            .stat-box p { font-size: 24px; font-weight: bold; color: #1e3a8a; margin-top: 5px; }
            table { width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-collapse: collapse; }
            th, td { padding: 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #1e3a8a; color: white; font-weight: 600; font-size: 12px; text-transform: uppercase; }
            tr:hover { background: #f8fafc; }
            .status { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; }
            .Pending { background: #fef3c7; color: #92400e; }
            .Reviewing { background: #dbeafe; color: #1e40af; }
            .Interview { background: #e0e7ff; color: #3730a3; }
            .Hired { background: #d1fae5; color: #065f46; }
            .Rejected { background: #fee2e2; color: #991b1b; }
            .delete { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
            .empty { text-align: center; padding: 60px; color: #64748b; }
            .resume-link { color: #2563eb; text-decoration: none; }
            .resume-link:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📋 Internship Applications (${applications.length})</h1>
            
            <div class="stats">
                <div class="stat-box"><h3>Total</h3><p>${applications.length}</p></div>
                <div class="stat-box"><h3>Pending</h3><p>${applications.filter(a => a.status === 'Pending').length}</p></div>
                <div class="stat-box"><h3>Interview</h3><p>${applications.filter(a => a.status === 'Interview').length}</p></div>
                <div class="stat-box"><h3>Hired</h3><p>${applications.filter(a => a.status === 'Hired').length}</p></div>
            </div>

            ${applications.length === 0 ? 
                '<div class="empty">No applications yet.</div>' :
                `<table>
                    <thead>
                        <tr>
                            <th>Name</th><th>Email</th><th>College</th><th>Year</th>
                            <th>Applied</th><th>Resume</th><th>Status</th><th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${applications.map(app => `
                            <tr>
                                <td><strong>${app.name}</strong></td>
                                <td>${app.email}</td>
                                <td>${app.college}</td>
                                <td>${app.year}</td>
                                <td>${app.appliedAt}</td>
                                <td><a href="${app.resume}" target="_blank" class="resume-link">View ↗</a></td>
                                <td>
                                    <select class="status ${app.status}" onchange="updateStatus('${app.id}', this.value)">
                                        ${['Pending','Reviewing','Interview','Hired','Rejected'].map(s => 
                                            `<option value="${s}" ${app.status === s ? 'selected' : ''}>${s}</option>`
                                        ).join('')}
                                    </select>
                                </td>
                                <td><button class="delete" onclick="deleteApp('${app.id}')">Delete</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`
            }
        </div>
        <script>
            async function updateStatus(id, status) {
                await fetch('/api/applications/' + id, {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({status})
                });
                location.reload();
            }
            async function deleteApp(id) {
                if(!confirm('Delete this application?')) return;
                await fetch('/api/applications/' + id, {method: 'DELETE'});
                location.reload();
            }
            setInterval(() => location.reload(), 5000);
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});