// routes/tickets.route.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const dbHelper = require('../dbHelper');
const axios = require('axios');

// Middleware d'authentification (existant)
const authenticate = require('../middleware/authenticate');

// Réserver un ticket avec option de paiement échelonné
router.post('/', authenticate, async (req, res) => {
  try {
    const { event_id, plan_id, payment_method = 'full' } = req.body;

    // Vérifier le plan de ticket
    const plan = await dbHelper.get(
      `SELECT * FROM ticket_plans WHERE id = ? AND event_id = ?`,
      [plan_id, event_id]
    );
    if (!plan) throw new Error('Plan de ticket non valide');

    // Vérifier si le paiement échelonné est autorisé
    if (payment_method === 'installment' && !plan.installment_allowed) {
      throw new Error('Paiement échelonné non autorisé pour ce ticket');
    }

    const reference = `TKT-${uuidv4().substr(0, 8).toUpperCase()}`;
    const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reference)}`;

    let installment_plan = null;
    if (payment_method === 'installment') {
      const installments = Math.min(3, plan.max_installments || 3);
      const installment_amount = Math.ceil(plan.price_sats / installments);
      
      installment_plan = JSON.stringify({
        total_installments: installments,
        installment_amount,
        payments_made: 0,
        next_payment_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    await dbHelper.beginTransaction();

    const result = await dbHelper.run(
      `INSERT INTO tickets 
       (user_id, event_id, plan_id, reference, total_amount_sats, 
        status, qr_code_url, installment_plan)
       VALUES (?, ?, ?, ?, ?, 'reserved', ?, ?)`,
      [
        req.user.id, 
        event_id, 
        plan_id, 
        reference, 
        plan.price_sats,
        qr_code_url,
        installment_plan
      ]
    );

    await dbHelper.commit();

    res.status(201).json({
      success: true,
      ticket: {
        id: result.lastID,
        reference,
        qr_code: qr_code_url,
        total_amount: plan.price_sats,
        payment_method,
        ...(installment_plan && {
          installment_plan: JSON.parse(installment_plan)
        })
      }
    });

  } catch (error) {
    await dbHelper.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
});



module.exports = router;