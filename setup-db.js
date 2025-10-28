const Database = require('better-sqlite3');
const db = new Database('submissions.db');

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

console.log('✅ Database initialized');
