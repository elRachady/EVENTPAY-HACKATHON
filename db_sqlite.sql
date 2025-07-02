-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price_fcfa INTEGER NOT NULL,
  price_sats INTEGER, -- optionnel, peut être calculé à la création
  date DATETIME,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des tickets (achats de billets)
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_id INTEGER,
  amount_paid_sats INTEGER DEFAULT 0,
  is_fully_paid INTEGER DEFAULT 0, -- 0 = non, 1 = oui
  qr_code TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(event_id) REFERENCES events(id)
);

-- Table des paiements Lightning
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER,
  amount_fcfa INTEGER NOT NULL,
  amount_sats INTEGER NOT NULL,
  payment_hash TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, failed
  conversion_rate REAL, -- taux FCFA/SATS utilisé
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(ticket_id) REFERENCES tickets(id)
);