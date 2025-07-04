const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'eventpay.db');
const db = new sqlite3.Database(dbPath);
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// dbHelper amélioré avec gestion des erreurs
const dbHelper = {
  get: (query, params) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error('DB Error (get):', err);
        return reject(err);
      }
      resolve(row);
    });
  }),
  run: (query, params) => new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        console.error('DB Error (run):', err);
        return reject(err);
      }
      resolve(this);
    });
  }),
  all: (query, params) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('DB Error (all):', err);
        return reject(err);
      }
      resolve(rows);
    });
  }),
  beginTransaction: () => new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('DB Error (beginTransaction):', err);
        return reject(err);
      }
      resolve();
    });
  }),
  commit: () => new Promise((resolve, reject) => {
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('DB Error (commit):', err);
        return reject(err);
      }
      resolve();
    });
  }),
  rollback: () => new Promise((resolve, reject) => {
    db.run('ROLLBACK', (err) => {
      if (err) console.error('DB Error (rollback):', err);
      resolve(); // On résout toujours pour permettre le traitement post-rollback
    });
  }),
};

// Middleware d'authentification amélioré
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Token manquant',
        code: 'MISSING_TOKEN'
      });
    }

    const user = await dbHelper.get(
      'SELECT id, email, role FROM users WHERE auth_token = ?',
      [token]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur d\'authentification',
      code: 'AUTH_ERROR'
    });
  }
};

// Création / réservation d'un ticket
router.post('/tickets', authenticate, async (req, res) => {
  let transaction;
  try {
    const { event_id, plan_id, payment_method = 'full' } = req.body;

    if (!event_id || !plan_id) {
      return res.status(400).json({
        success: false,
        error: 'Les champs event_id et plan_id sont obligatoires',
        code: 'MISSING_FIELDS'
      });
    }

    const [event, plan] = await Promise.all([
      dbHelper.get('SELECT * FROM events WHERE id = ? AND date > datetime("now")', [event_id]),
      dbHelper.get('SELECT * FROM ticket_plans WHERE id = ? AND event_id = ?', [plan_id, event_id])
    ]);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Événement non trouvé ou terminé',
        code: 'EVENT_NOT_FOUND'
      });
    }

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan de ticket non valide',
        code: 'INVALID_PLAN'
      });
    }

    const ticketsSold = await dbHelper.get(
      'SELECT COUNT(*) as count FROM tickets WHERE plan_id = ?',
      [plan_id]
    );

    if (ticketsSold.count >= plan.quantity) {
      return res.status(400).json({
        success: false,
        error: 'Plus de billets disponibles pour ce plan',
        code: 'SOLD_OUT'
      });
    }

    let installment_plan = null;
    if (payment_method === 'installment') {
      if (!plan.installment_allowed) {
        return res.status(400).json({
          success: false,
          error: 'Paiement échelonné non autorisé pour ce billet',
          code: 'INSTALLMENT_NOT_ALLOWED'
        });
      }

      const installments = Math.min(3, plan.max_installments || 3);
      const installment_amount = Math.ceil(plan.price_sats / installments);
      
      installment_plan = JSON.stringify({
        total_installments: installments,
        installment_amount,
        payments_made: 0,
        next_payment_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const reference = `TKT-${uuidv4().substr(0, 8).toUpperCase()}`;
    const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reference)}`;

    await dbHelper.beginTransaction();

    const result = await dbHelper.run(
      `INSERT INTO tickets (
        user_id, event_id, plan_id, reference, 
        total_amount_sats, status, qr_code_url, installment_plan
      ) VALUES (?, ?, ?, ?, ?, 'reserved', ?, ?)`,
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
        ...(installment_plan && { installment_plan: JSON.parse(installment_plan) })
      }
    });

  } catch (error) {
    if (transaction) await dbHelper.rollback();
    console.error('Ticket Creation Error:', error);
    
    const status = error.code === 'SQLITE_CONSTRAINT' ? 409 : 500;
    res.status(status).json({ 
      success: false,
      error: error.message,
      code: 'TICKET_CREATION_FAILED'
    });
  }
});

// Liste des tickets d'un utilisateur
router.get('/my', authenticate, async (req, res) => {
  try {
    const tickets = await dbHelper.all(`
      SELECT 
        t.id, t.reference, t.status,
        t.amount_paid_sats, t.total_amount_sats,
        e.name as title, e.location, e.date, e.image_url as image,
        p.type as category
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_plans p ON t.plan_id = p.id
      WHERE t.user_id = ? AND t.status != 'used'
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    
    res.json(tickets.map(ticket => ({
      ...ticket,
      date: new Date(ticket.date).toLocaleDateString('fr-FR'),
      price: ticket.total_amount_sats,
      progress: ticket.amount_paid_sats
    })));
    
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Plans disponibles pour un événement
router.get('/events/:id/plans', async (req, res) => {
  try {
    const plans = await dbHelper.all(`
      SELECT 
        id, type as name, price_sats, 
        installment_allowed, min_installment_amount,
        max_installments, quantity,
        (quantity - (SELECT COUNT(*) FROM tickets WHERE plan_id = ticket_plans.id)) as remaining
      FROM ticket_plans 
      WHERE event_id = ? AND quantity > (SELECT COUNT(*) FROM tickets WHERE plan_id = ticket_plans.id)
    `, [req.params.id]);

    res.json({
      success: true,
      plans: plans.map(plan => ({
        ...plan,
        features: getPlanFeatures(plan.name)
      }))
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch plans'
    });
  }
});

// Fonction helper pour les caractéristiques des plans
function getPlanFeatures(planType) {
  const featuresMap = {
    'standard': ['Accès à l\'événement', 'Place standard', 'Goodies de base'],
    'vip': ['Accès VIP', 'Place privilégiée', 'Rencontre artistes', 'Goodies premium'],
    'premium': ['Accès backstage', 'Photo avec artistes', 'Cadeau exclusif']
  };
  return featuresMap[planType] || ['Accès à l\'événement'];
}

// Génération de facture (invoice) Lightning
router.post('/tickets/:id/invoices', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, memo } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Montant invalide',
        code: 'INVALID_AMOUNT'
      });
    }

    const ticket = await dbHelper.get(
      `SELECT t.*, p.installment_allowed, p.min_installment_amount
       FROM tickets t
       JOIN ticket_plans p ON t.plan_id = p.id
       WHERE t.id = ? AND t.user_id = ?`,
      [id, req.user.id]
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket non trouvé',
        code: 'TICKET_NOT_FOUND'
      });
    }

    const remaining = ticket.total_amount_sats - (ticket.amount_paid_sats || 0);
    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Ce ticket est déjà entièrement payé',
        code: 'ALREADY_PAID'
      });
    }

    let payment_amount = parseInt(amount);
    if (ticket.installment_plan) {
      const plan = JSON.parse(ticket.installment_plan);
      payment_amount = Math.min(
        payment_amount,
        plan.installment_amount,
        remaining
      );
      
      if (payment_amount < (ticket.min_installment_amount || 1000)) {
        return res.status(400).json({
          success: false,
          error: `Le montant minimum par échéance est ${ticket.min_installment_amount} SATS`,
          code: 'MIN_INSTALLMENT'
        });
      }
    }

    const invoiceResponse = await axios.post(
      `${process.env.LNBITS_URL}/api/v1/payments`,
      {
        out: false,
        amount: payment_amount,
        memo: memo || `Paiement pour ticket ${ticket.reference}`,
        expiry: 3600 // 1 heure
      },
      {
        headers: {
          'X-Api-Key': process.env.LNBITS_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    await dbHelper.run(
      `INSERT INTO payments (
        ticket_id, payment_request, payment_hash, 
        amount_sats, status, expires_at
      ) VALUES (?, ?, ?, ?, 'pending', datetime('now', '+1 hour'))`,
      [
        id,
        invoiceResponse.data.payment_request,
        invoiceResponse.data.payment_hash,
        payment_amount
      ]
    );

    res.json({
      success: true,
      invoice: {
        payment_request: invoiceResponse.data.payment_request,
        payment_hash: invoiceResponse.data.payment_hash,
        amount: payment_amount,
        expires_in: 3600,
        memo: memo || `Paiement pour ticket ${ticket.reference}`
      }
    });

  } catch (error) {
    console.error('Invoice Generation Error:', error);
    
    const status = error.response?.status || 500;
    res.status(status).json({
      success: false,
      error: error.message,
      code: 'INVOICE_GENERATION_FAILED',
      details: error.response?.data || undefined
    });
  }
});

// Webhook de paiement (appelé par LNBITS)
router.post('/webhook', express.json(), async (req, res) => {
  let transaction;
  try {
    const { payment_hash } = req.body;
    if (!payment_hash) {
      return res.status(400).json({
        success: false,
        error: 'payment_hash manquant',
        code: 'MISSING_HASH'
      });
    }

    await dbHelper.beginTransaction();

    const payment = await dbHelper.get(
      `SELECT * FROM payments WHERE payment_hash = ? FOR UPDATE`,
      [payment_hash]
    );

    if (!payment) {
      await dbHelper.rollback();
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    if (payment.status === 'paid') {
      await dbHelper.rollback();
      return res.json({ 
        success: true, 
        status: 'already_processed',
        payment_id: payment.id
      });
    }

    await dbHelper.run(
      `UPDATE payments SET status = 'paid', paid_at = datetime('now') 
       WHERE id = ?`,
      [payment.id]
    );

    const ticket = await dbHelper.get(
      `SELECT * FROM tickets WHERE id = ? FOR UPDATE`,
      [payment.ticket_id]
    );

    const new_amount_paid = (ticket.amount_paid_sats || 0) + payment.amount_sats;
    let new_status = ticket.status;

    if (new_amount_paid >= ticket.total_amount_sats) {
      new_status = 'paid';
    } else if (new_amount_paid > 0) {
      new_status = 'partial';
      if (ticket.installment_plan) {
        const plan = JSON.parse(ticket.installment_plan);
        plan.payments_made += 1;

        if (plan.payments_made < plan.total_installments) {
          plan.next_payment_due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          await dbHelper.run(
            `UPDATE tickets SET installment_plan = ? WHERE id = ?`,
            [JSON.stringify(plan), ticket.id]
          );
        }
      }
    }

    await dbHelper.run(
      `UPDATE tickets 
       SET amount_paid_sats = ?, status = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [new_amount_paid, new_status, ticket.id]
    );

    await dbHelper.commit();

    // Ici tu peux déclencher notification (email, webhook, etc.)

    res.json({ 
      success: true,
      ticket_id: ticket.id,
      new_status,
      amount_paid: new_amount_paid,
      remaining: ticket.total_amount_sats - new_amount_paid
    });

  } catch (error) {
    if (transaction) await dbHelper.rollback();
    console.error('Webhook Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      code: 'WEBHOOK_PROCESSING_ERROR'
    });
  }
});

// Validation d'un ticket par référence (organisateur uniquement)
router.get('/tickets/validate/:reference', authenticate, async (req, res) => {
  try {
    const { reference } = req.params;

    if (req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
        code: 'ACCESS_DENIED'
      });
    }

    const ticket = await dbHelper.get(
      `SELECT t.*, e.name as event_name, e.user_id as organizer_id,
              u.name as attendee_name, u.email as attendee_email
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN users u ON t.user_id = u.id
       WHERE t.reference = ?`,
      [reference]
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket non trouvé',
        code: 'TICKET_NOT_FOUND'
      });
    }

    if (ticket.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez pas valider ce ticket',
        code: 'NOT_AUTHORIZED'
      });
    }

    if (ticket.status !== 'paid') {
      return res.json({
        success: false,
        valid: false,
        reason: ticket.status === 'pending' ? 'Paiement incomplet' : 'Ticket annulé',
        code: 'INVALID_TICKET_STATUS'
      });
    }

    await dbHelper.run(
      `UPDATE tickets SET status = 'used', used_at = datetime('now') 
       WHERE id = ?`,
      [ticket.id]
    );

    res.json({
      success: true,
      valid: true,
      ticket: {
        id: ticket.id,
        reference: ticket.reference,
        event_name: ticket.event_name,
        attendee_name: ticket.attendee_name,
        attendee_email: ticket.attendee_email,
        validated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Ticket Validation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR'
    });
  }
});

module.exports = router;
