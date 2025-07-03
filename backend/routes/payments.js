const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { checkInvoice } = require('../services/lnbits');
const authenticate = require('../middlewares/auth');

// Suivi des paiements partiels
router.post('/:order_id/partial', authenticate, async (req, res) => {
  const { order_id } = req.params;
  const { payment_hash, amount_sats } = req.body;

  // Vérifier le paiement
  const invoice = await checkInvoice(payment_hash);
  if (!invoice.paid) return res.status(400).json({ error: "Paiement non reçu" });

  // Mettre à jour la commande
  db.run(
    `UPDATE orders 
     SET paid_amount_sats = paid_amount_sats + ? 
     WHERE id = ? AND user_id = ?`,
    [amount_sats, order_id, req.userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Vérifier si le paiement est complet
      db.get(
        `SELECT total_sats, paid_amount_sats 
         FROM orders WHERE id = ?`,
        [order_id],
        (err, order) => {
          if (order.paid_amount_sats >= order.total_sats) {
            db.run(
              `UPDATE orders SET status = 'paid' 
               WHERE id = ?`,
              [order_id]
            );
          }
          res.json({ 
            remaining: order.total_sats - order.paid_amount_sats 
          });
        }
      );
    }
  );
});

module.exports = router;