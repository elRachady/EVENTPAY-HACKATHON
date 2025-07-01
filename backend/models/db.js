const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../ticketsats.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Créer les tables (exécuté au démarrage)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      date TEXT,
      owner_id INTEGER
    )
  `);
  // Ajouter les autres tables (tickets, orders, etc.)
});


// Création des tables (si inexistantes)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    owner_id INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    price_xof INTEGER NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    total_sats INTEGER NOT NULL,
    paid_amount_sats INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
  )`);
});

module.exports = db;