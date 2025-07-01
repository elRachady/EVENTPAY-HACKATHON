const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Valider un billet (scan QR code)
router.get('/:order_id', (req, res) => {
  const { order_id } = req.params;
  db.get(
    `SELECT o.*, t.event_id, e.name as event_name 
     FROM orders o
     JOIN tickets t ON o.ticket_id = t.id
     JOIN events e ON t.event_id = e.id
     WHERE o.id = ? AND o.status = "paid"`,
    [order_id],
    (err, order) => {
      if (err || !order) return res.json({ valid: false });
      res.json({ valid: true, event: order.event_name });
    }
  );
});

module.exports = router;