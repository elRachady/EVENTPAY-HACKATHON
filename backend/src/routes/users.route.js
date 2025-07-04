const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', '..', 'eventpay.db');
console.log('DB path used:', dbPath); 
const db = new sqlite3.Database(dbPath);

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
  console.log('Tentative login:', email, password); // Ajoute ce log
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    const token = uuidv4();
    db.run('UPDATE users SET auth_token = ? WHERE id = ?', [token, user.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ user: { ...user, auth_token: token } });
    });
  });
});

// Middleware pour vérifier le token d'authentification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token d\'authentification manquant' });

  db.get('SELECT * FROM users WHERE auth_token = ?', [token], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(403).json({ error: 'Token d\'authentification invalide' });
    req.user = user;
    next();
  });
};

// Exemple de route protégée
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Vous avez accédé à une route protégée!', user: req.user });
});

module.exports = router;