const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { checkInvoice } = require('../services/lnbits');

// Vérifier un paiement partiel
router.post('/:order_id/partial', async (req, res) => {
  const { order_id } = req.params;
  const { payment_hash, amount_sats } = req.body;

  // 1. Vérifier le paiement via LNbits
  const invoice = await checkInvoice(payment_hash);
  if (!invoice.paid) return res.status(400).json({ error: 'Paiement non reçu' });

  // 2. Mettre à jour la commande
  db.run(
    'UPDATE orders SET paid_amount_sats = paid_amount_sats + ? WHERE id = ?',
    [amount_sats, order_id],
    async function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // 3. Vérifier si le paiement est complet
      const order = await new Promise((resolve) => {
        db.get('SELECT * FROM orders WHERE id = ?', [order_id], (err, row) => resolve(row));
      });

      if (order.paid_amount_sats >= order.total_sats) {
        db.run('UPDATE orders SET status = "paid" WHERE id = ?', [order_id]);
      }

      res.json({ remaining_sats: order.total_sats - order.paid_amount_sats });
    }
  );
});

module.exports = router;