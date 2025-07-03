const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authenticate = require('../middlewares/auth');

// Récupérer les événements d'un organisateur
router.get('/events', authenticate, (req, res) => {
  db.all(
    `SELECT * FROM events 
     WHERE owner_id = ?`,
    [req.userId],
    (err, events) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(events);
    }
  );
});

// Statistiques de vente par événement
router.get('/events/:id/stats', authenticate, (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT 
       COUNT(*) as total_tickets,
       SUM(paid_amount_sats) as total_sats
     FROM orders
     JOIN tickets ON orders.ticket_id = tickets.id
     WHERE tickets.event_id = ?`,
    [id],
    (err, stats) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(stats);
    }
  );
});

module.exports = router;