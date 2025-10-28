const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files from "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'globalfoundationoutreach@gmail.com',
    pass: 'cykk suyh usag kehu' // ← Replace with your actual app password
  }
});

// Upload route
app.post('/upload', upload.fields([
  { name: 'handwriting', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  const submissionsPath = path.join(__dirname, 'submissions.json');

  let submissions = [];
  if (fs.existsSync(submissionsPath)) {
    submissions = JSON.parse(fs.readFileSync(submissionsPath));
  }

  submissions.push({
    id: Date.now(),
    name: req.body.name,
    email: req.body.email,
    handwriting: req.files.handwriting[0].filename,
    video: req.files.video[0].filename,
    status: 'pending',
    votes: 0
  });

  fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
  res.redirect('/success.html');
});

// Get all submissions
app.get('/submissions', (req, res) => {
  const submissionsPath = path.join(__dirname, 'submissions.json');
  const data = fs.existsSync(submissionsPath)
    ? JSON.parse(fs.readFileSync(submissionsPath))
    : [];
  res.json(data);
});

// Approve a submission and send email
app.post('/approve/:id', (req, res) => {
  const submissionsPath = path.join(__dirname, 'submissions.json');
  let data = fs.existsSync(submissionsPath)
    ? JSON.parse(fs.readFileSync(submissionsPath))
    : [];

  data = data.map(entry =>
    entry.id == req.params.id ? { ...entry, status: 'approved' } : entry
  );

  fs.writeFileSync(submissionsPath, JSON.stringify(data, null, 2));

  const approvedEntry = data.find(entry => entry.id == req.params.id);

  const mailOptions = {
    from: 'globalfoundationoutreach@gmail.com',
    to: approvedEntry.email,
    subject: 'Your submission is live!',
    text: `Hi ${approvedEntry.name},\n\nYour handwriting contest entry has been approved and is now live on the feed!\n\nView it here: https://handwriting-contest.onrender.com/feed.html\n\nGood luck!\n\n– Handwriting Contest Team`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('❌ Email failed:', error);
    } else {
      console.log('✅ Email sent:', info.response);
    }
  });

  res.sendStatus(200);
});

// Vote for a submission
app.post('/vote/:id', (req, res) => {
  const submissionsPath = path.join(__dirname, 'submissions.json');
  let data = fs.existsSync(submissionsPath)
    ? JSON.parse(fs.readFileSync(submissionsPath))
    : [];

  data = data.map(entry =>
    entry.id == req.params.id ? { ...entry, votes: entry.votes + 1 } : entry
  );

  fs.writeFileSync(submissionsPath, JSON.stringify(data, null, 2));
  res.sendStatus(200);
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
