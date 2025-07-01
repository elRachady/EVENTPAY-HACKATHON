const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Créer un événement
router.post('/', (req, res) => {
  const { name, date, owner_id } = req.body;
  db.run(
    'INSERT INTO events (name, date, owner_id) VALUES (?, ?, ?)',
    [name, date, owner_id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Lister les événements
router.get('/', (req, res) => {
  db.all('SELECT * FROM events', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;