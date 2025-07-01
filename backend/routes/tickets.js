const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { createInvoice, checkInvoice } = require('../services/lnbits');

// Créer un type de billet
router.post('/', (req, res) => {
  const { event_id, price_xof } = req.body;
  db.run(
    'INSERT INTO tickets (event_id, price_xof) VALUES (?, ?)',
    [event_id, price_xof],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Acheter un billet (créer une invoice Lightning)
router.post('/:id/purchase', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  // 1. Récupérer le prix en XOF et convertir en sats (ex: 1 XOF ≈ 0.5 sats)
  db.get('SELECT price_xof FROM tickets WHERE id = ?', [id], async (err, ticket) => {
    if (err || !ticket) return res.status(404).json({ error: 'Billet introuvable' });

    const amount_sats = Math.ceil(ticket.price_xof * 0.5); // Conversion simplifiée
    const invoice = await createInvoice(amount_sats, `Billet #${id}`);

    // 2. Enregistrer la commande
    db.run(
      'INSERT INTO orders (ticket_id, user_id, total_sats) VALUES (?, ?, ?)',
      [id, user_id, amount_sats],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ invoice, order_id: this.lastID });
      }
    );
  });
});

module.exports = router;