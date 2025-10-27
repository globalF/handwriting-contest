const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Save files to /uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Handle form submission
app.post('/upload', upload.fields([
  { name: 'handwriting', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  console.log('Files received:', req.files);
  console.log('Form data:', req.body);
  res.redirect('/success.html');
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
