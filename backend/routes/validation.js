const express = require('express');
const router = express.Router();
const db = require('../models/db');
const crypto = require('crypto');


// Clé publique (dérivée de la clé privée)
const PUBLIC_KEY = crypto.createPublicKey({
  key: process.env.TICKETSATS_PRIVATE_KEY,
  format: 'pem',
  type: 'pkcs8'
});

// Valider un ticket scanné
router.post('/verify', async (req, res) => {
  const { qr_data } = req.body;
  let ticketData;
  
  try {
    ticketData = JSON.parse(qr_data);
  } catch (err) {
    return res.status(400).json({ valid: false, error: "QR code invalide" });
  }

  // 1. Vérifier la signature
  const verify = crypto.createVerify('SHA256');
  verify.update(JSON.stringify({
    event_id: ticketData.event_id,
    ticket_id: ticketData.ticket_id,
    buyer_ln_address: ticketData.buyer_ln_address,
    partial_payments: ticketData.partial_payments,
    timestamp: ticketData.timestamp
  }) + ticketData.secret_salt);
  
  const isSignatureValid = verify.verify(PUBLIC_KEY, ticketData.signature, 'base64');

  if (!isSignatureValid) {
    return res.json({ valid: false, error: "Signature invalide" });
  }

  // 2. Vérifier le statut en base de données
  db.get(
    `SELECT status, secret_salt FROM tickets 
     WHERE ticket_id = ?`,
    [ticketData.ticket_id],
    (err, ticket) => {
      if (err || !ticket) {
        return res.json({ valid: false, error: "Ticket introuvable" });
      }

      // 3. Vérifier le checksum
      const checksum = crypto.createHash('sha256')
        .update(ticketData.ticket_id + ticket.secret_salt)
        .digest('hex');
      
      if (checksum !== ticketData.checksum) {
        return res.json({ valid: false, error: "Checksum invalide" });
      }

      // 4. Marquer comme utilisé (optionnel)
      db.run(
        `UPDATE tickets SET status = 'used' 
         WHERE ticket_id = ?`,
        [ticketData.ticket_id]
      );

      res.json({ valid: true, event_id: ticketData.event_id });
    }
  );
});

module.exports = router;

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