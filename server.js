const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Save files to /uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Upload route
app.post('/upload', upload.fields([
  { name: 'handwriting', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  const submissionsPath = path.join(__dirname, 'submissions.json');
  console.log('✅ Submission saved to submissions.json');

  // Serve submissions to admin
app.get('/submissions', (req, res) => {
  const submissionsPath = path.join(__dirname, 'submissions.json');
  const data = fs.existsSync(submissionsPath)
    ? JSON.parse(fs.readFileSync(submissionsPath))
    : [];
  res.json(data);
});

// Approve a submission
app.post('/approve/:id', (req, res) => {
  const submissionsPath = path.join(__dirname, 'submissions.json');
  let data = fs.existsSync(submissionsPath)
    ? JSON.parse(fs.readFileSync(submissionsPath))
    : [];

  data = data.map(entry =>
    entry.id == req.params.id ? { ...entry, status: 'approved' } : entry
  );

  fs.writeFileSync(submissionsPath, JSON.stringify(data, null, 2));
  res.sendStatus(200);
});

  // Load existing submissions
  let submissions = [];
  if (fs.existsSync(submissionsPath)) {
    submissions = JSON.parse(fs.readFileSync(submissionsPath));
  }

  // Add new submission
  submissions.push({
    id: Date.now(),
    name: req.body.name,
    email: req.body.email,
    handwriting: req.files.handwriting[0].filename,
    video: req.files.video[0].filename,
    status: 'pending',
    votes: 0
  });

  // Save back to file
  fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));

  res.redirect('/success.html');
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
