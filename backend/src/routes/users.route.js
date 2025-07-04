const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('eventpay.db');

// Lister tous les utilisateurs (optionnel)
router.get('/', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ users: rows });
  });
});

// Créer un utilisateur
router.post('/', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone, hashedPassword, role || 'spectator'],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, user_id: this.lastID });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recherche utilisateur par email et mot de passe (pour login)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    res.json({ user });
  });
});

// Route pour créer des utilisateurs fictifs pour les tests
router.post('/seed-fake-users', async (req, res) => {
  const fakeUsers = [
    { name: 'Alice', email: 'alice@test.com', phone: '0600000001', password: 'alice123', role: 'admin' },
    { name: 'Bob', email: 'bob@test.com', phone: '0600000002', password: 'bob123', role: 'organizer' },
    { name: 'Charlie', email: 'charlie@test.com', phone: '0600000003', password: 'charlie123', role: 'spectator' }
  ];
  try {
    for (const user of fakeUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      db.run(
        `INSERT OR IGNORE INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
        [user.name, user.email, user.phone, hashedPassword, user.role]
      );
    }
    res.json({ success: true, message: 'Utilisateurs fictifs créés' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;