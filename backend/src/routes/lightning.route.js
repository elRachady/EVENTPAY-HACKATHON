const express = require('express');
const lnbitsService = require('../services/lnbits.service.js');
const qr = require('qrcode');
const { validatePayment } = require('../middleware/validation.js');

const router = express.Router();

// Obtenir le solde
router.get('/balance', async (req, res, next) => {
  try {
    const balance = await lnbitsService.getWalletBalance(req.lnbitsConfig);
    res.json({ success: true, data: balance });
  } catch (error) {
    next(error);
  }
});

// Créer une facture
router.post('/invoice/create', async (req, res, next) => {
  try {
    const { amount, memo, expiry } = req.body;

    // Construction dynamique du payload
    const payload = {
      amount,
      memo
    };
    // Ajoute expiry SEULEMENT si c'est un entier positif
    if (expiry !== undefined && expiry !== null && expiry !== "" && !isNaN(Number(expiry))) {
      payload.expiry = parseInt(expiry, 10);
    }

    const invoice = await lnbitsService.createInvoice(
      amount, // premier paramètre : le montant
      memo,   // deuxième : le memo
      expiry  // troisième : expiry (optionnel)
    );

    const qrCode = await qr.toDataURL(invoice.payment_request);

    res.json({
      success: true,
      data: {
        ...invoice,
        qr_code: qrCode,
        amount,
        memo
      }
    });
  } catch (error) {
    next(error);
  }
});

// Vérifier paiement
router.get('/payment/:paymentHash', async (req, res, next) => {
  try {
    const payment = await lnbitsService.checkPayment(
      req.lnbitsConfig,
      req.params.paymentHash
    );
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
});

// Payer une facture
router.post('/invoice/pay', validatePayment, async (req, res, next) => {
  try {
    const payment = await lnbitsService.payInvoice(
      req.lnbitsConfig,
      req.body.bolt11
    );
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
});

module.exports = router;