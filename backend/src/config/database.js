const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', '..', 'database');
const DB_PATH = path.join(DB_DIR, 'carmodapp.db');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

module.exports = db;
