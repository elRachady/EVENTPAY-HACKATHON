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

    // Validation des paramètres
    if (!amount || isNaN(amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Montant invalide ou manquant'
      });
    }

    const amountInt = parseInt(amount, 10);
    if (amountInt < 50) { // Minimum de 50 SATS
      return res.status(400).json({
        success: false,
        error: 'Le montant minimum est de 50 SATS'
      });
    }

    if (!memo || typeof memo !== 'string' || memo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Description du paiement requise'
      });
    }

    // Gestion de l'expiration
    let expiryInt = 3600; // Valeur par défaut: 1 heure
    if (expiry !== undefined && expiry !== null && !isNaN(parseInt(expiry, 10))) {
      expiryInt = parseInt(expiry, 10);
      // Limiter entre 5 minutes et 24 heures
      expiryInt = Math.max(300, Math.min(expiryInt, 86400));
    }

    // Création de la facture
    const invoice = await lnbitsService.createInvoice(
      amountInt,
      memo.trim(),
      expiryInt
    );

    // Validation de la réponse
    if (!invoice?.payment_request) {
      throw new Error('Réponse invalide du serveur LNbits');
    }

    // Génération du QR Code
    const qrCode = await qr.toDataURL(invoice.payment_request);

    // Réponse finale
    res.json({
      success: true,
      data: {
        ...invoice,
        qr_code: qrCode,
        amount: amountInt,
        memo: memo.trim(),
        expiry: expiryInt,
        created_at: Math.floor(Date.now() / 1000) // Timestamp UNIX
      }
    });

  } catch (error) {
    console.error('Erreur création invoice:', error);
    
    // Erreurs spécifiques de LNbits
    if (error.message.includes('amount too small')) {
      return res.status(400).json({
        success: false,
        error: 'Le montant est trop petit pour le réseau Lightning'
      });
    }

    // Erreur générique
    res.status(500).json({
      success: false,
      error: 'Échec de création de la facture',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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