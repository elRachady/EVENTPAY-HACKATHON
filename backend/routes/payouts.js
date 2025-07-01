const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Simuler un décaissement
router.post('/request', (req, res) => {
  const { order_id, bank_account } = req.body;
  db.get(
    'SELECT * FROM orders WHERE id = ? AND status = "paid"',
    [order_id],
    (err, order) => {
      if (err || !order) return res.status(400).json({ error: 'Commande invalide' });

      // Mock: Enregistrer la demande
      db.run(
        'INSERT INTO payouts (order_id, amount_xof, bank_account) VALUES (?, ?, ?)',
        [order_id, order.total_sats * 2, bank_account], // 1 sat = 2 XOF (mock)
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ payout_id: this.lastID });
        }
      );
    }
  );
});

module.exports = router;