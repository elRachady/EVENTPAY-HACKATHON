const express = require('express');
const router = express.Router();
const { handlePaymentWebhook } = require('../services/webhooks');

router.post('/lnbits', async (req, res) => {
  const { payment_hash } = req.body;
  await handlePaymentWebhook(payment_hash);
  res.sendStatus(200);
});

module.exports = router;