const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('eventpay.db');

// Lister tous les utilisateurs (optionnel)
router.get('/', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ users: rows });
  });
});

// Créer un utilisateur
router.post('/', (req, res) => {
  const { name, email, phone, password, role } = req.body;
  db.run(
    `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone, password, role || 'spectator'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, user_id: this.lastID });
    }
  );
});

// Recherche utilisateur par email et mot de passe (pour login)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    res.json({ user });
  });
});

module.exports = router;