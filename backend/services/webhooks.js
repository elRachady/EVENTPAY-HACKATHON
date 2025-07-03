const axios = require('axios');
const db = require('../models/db');

const handlePaymentWebhook = async (payment_hash) => {
  // 1. Vérifier le statut du paiement
  const invoice = await checkInvoice(payment_hash);
  
  // 2. Mettre à jour la commande
  if (invoice.paid) {
    db.run(
      `UPDATE orders 
       SET paid_amount_sats = paid_amount_sats + ? 
       WHERE payment_hash = ?`,
      [invoice.amount, payment_hash]
    );
  }
};

module.exports = { handlePaymentWebhook };