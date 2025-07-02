
const express = require('express');
const router = express.Router();
const lnbitsService = require('../services/lnbits.service');
const qr = require("qrcode")
const { validateInvoiceCreation, validatePayment } = require('../middleware/validation');

// Get wallet balance
router.get('/balance', async (req, res, next) => {
  try {
    const balance = await lnbitsService.getWalletBalance();
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    next(error);
  }
});


// Create Lightning invoice
router.post('/invoice/create', async (req, res, next) => {
  console.log('BODY:', req.body);
  try {
    const { amount, memo, expiry } = req.body;
    const invoice = await lnbitsService.createInvoice(amount, memo, expiry);
    
    const url = await qr.toDataURL(invoice.payment_request, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });
    console.log('QR CODE URL:', url);
    console.log('INVOICE:', invoice);
    res.json({
      success: true,
      data: {
        payment_hash: invoice.payment_hash,
        payment_request: invoice.payment_request,
        checking_id: invoice.checking_id,
        amount: amount,
        memo: memo,
        expiry: expiry
      }
    });
  } catch (error) {
    next(error);
  }
});

// Check payment status
router.get('/payment/:paymentHash', async (req, res, next) => {
  try {
    const { paymentHash } = req.params;
    const payment = await lnbitsService.checkPayment(paymentHash);
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
});


// Pay Lightning invoice
router.post('/invoice/pay', validatePayment, async (req, res, next) => {
  try {
    const { bolt11 } = req.body;
    const payment = await lnbitsService.payInvoice(bolt11);
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
});

// Get payment history
router.get('/payments', async (req, res, next) => {
  try {
    const limit = req.query.limit || 50;
    const payments = await lnbitsService.getPaymentHistory(limit);
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
});

// Decode Lightning invoice
router.post('/invoice/decode', async (req, res, next) => {
  try {
    const { bolt11 } = req.body;
    
    if (!bolt11) {
      return res.status(400).json({
        success: false,
        error: 'bolt11 invoice is required'
      });
    }

    const decoded = await lnbitsService.decodeInvoice(bolt11);
    
    res.json({
      success: true,
      data: decoded
    });
  } catch (error) {
    next(error);
  }
});

// Create new wallet
router.post('/wallet/create', async (req, res, next) => {
  try {
    const { name, adminId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Wallet name is required'
      });
    }

    const wallet = await lnbitsService.createWallet(name, adminId);
    
    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

