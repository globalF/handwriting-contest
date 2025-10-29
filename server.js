const express = require('express');
const multer = require('multer');
const path = require('path');
const Database = require('better-sqlite3');
const axios = require('axios');

const app = express();
const db = new Database('submissions.db');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    handwriting TEXT,
    video TEXT,
    status TEXT,
    votes INTEGER
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voterName TEXT,
    contestantId INTEGER,
    voteCount INTEGER,
    message TEXT,
    timestamp TEXT
  );
`);

// Send email via Resend
function sendApprovalEmail(name, email) {
  axios.post('https://api.resend.com/emails', {
    from: 'Handwriting Contest <noreply@globalfoundationoutreach.com>',
    to: email,
    subject: 'Your submission is live!',
    text: `Hi ${name},\n\nYour handwriting contest entry has been approved and is now live on the feed!\n\nView it here: https://handwriting-contest.onrender.com/feed.html\n\nGood luck!\n\n– Handwriting Contest Team`
  }, {
    headers: {
      Authorization: 're_HkVXHiWz_6hpt9TyCexmMFHurd641AkET' // Replace with your actual Resend API key
    }
  }).then(res => {
    console.log('✅ Email sent:', res.data);
  }).catch(err => {
    console.error('❌ Email failed:', err.message);
  });
}

// Upload route
app.post('/upload', upload.fields([
  { name: 'handwriting', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  const stmt = db.prepare(`
    INSERT INTO submissions (name, email, handwriting, video, status, votes)
    VALUES (?, ?, ?, ?, 'pending', 0)
  `);
  stmt.run(
    req.body.name,
    req.body.email,
    req.files.handwriting[0].filename,
    req.files.video[0].filename
  );
  res.redirect('/success.html');
});

// Get all submissions (sorted by votes)
app.get('/submissions', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM submissions
    WHERE status = 'approved'
    ORDER BY votes DESC
  `).all();
  res.json(rows);
});

// Approve a submission
app.post('/approve/:id', (req, res) => {
  const update = db.prepare('UPDATE submissions SET status = ? WHERE id = ?');
  update.run('approved', req.params.id);

  const entry = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (entry) sendApprovalEmail(entry.name, entry.email);

  res.sendStatus(200);
});

// Submit paid vote with name, message, and count
app.post('/submit-vote', (req, res) => {
  const { voterName, message, voteCount, contestantId } = req.body;

  try {
    const insertVote = db.prepare(`
      INSERT INTO votes (voterName, contestantId, voteCount, message, timestamp)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    insertVote.run(voterName, contestantId, voteCount, message);

    const updateVotes = db.prepare(`
      UPDATE submissions
      SET votes = votes + ?
      WHERE id = ?
    `);
    updateVotes.run(voteCount, contestantId);

    res.status(200).send({ success: true });
  } catch (err) {
    console.error('❌ Error saving vote:', err);
    res.status(500).send({ error: 'Failed to save vote' });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

app.get('/votes/:id', (req, res) => {
  const stmt = db.prepare(`
    SELECT voterName, voteCount, message, timestamp
    FROM votes
    WHERE contestantId = ?
    ORDER BY timestamp DESC
  `);
  const votes = stmt.all(req.params.id);
  res.json(votes);
});

