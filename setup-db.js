const Database = require('better-sqlite3');
const db = new Database('submissions.db');

// Create submissions table
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    handwriting TEXT,
    video TEXT,
    status TEXT,
    votes INTEGER
  )
`);

// Create votes table
db.exec(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voterName TEXT,
    contestantId INTEGER,
    voteCount INTEGER,
    message TEXT,
    timestamp TEXT
  )
`);

console.log('✅ Database initialized with submissions and votes tables');
