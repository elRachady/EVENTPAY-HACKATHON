const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'eventpay.db');
const db = new sqlite3.Database(dbPath);
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// dbHelper
const dbHelper = {
  get: (query, params) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
  }),
  run: (query, params) => new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      err ? reject(err) : resolve(this);
    });
  }),
  all: (query, params) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
  }),
  beginTransaction: () => new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => err ? reject(err) : resolve());
  }),
  commit: () => new Promise((resolve, reject) => {
    db.run('COMMIT', (err) => err ? reject(err) : resolve());
  }),
  rollback: () => new Promise((resolve, reject) => {
    db.run('ROLLBACK', (err) => err ? reject(err) : resolve());
  }),
};

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const user = await dbHelper.get(
      'SELECT id, email, role FROM users WHERE auth_token = ?',
      [token]
    );

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// Réserver un ticket
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { event_id, ticket_type = 'standard' } = req.body;

    const event = await dbHelper.get(
      `SELECT id, price_sats FROM events 
       WHERE id = ? AND date > datetime('now')`,
      [event_id]
    );
    if (!event) throw new Error('Événement non trouvé ou terminé');

    const reference = `TKT-${uuidv4().substr(0, 8).toUpperCase()}`;
    const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reference)}`;

    await dbHelper.beginTransaction();

    const result = await dbHelper.run(
      `INSERT INTO tickets 
       (user_id, event_id, ticket_type, status, reference, total_amount_sats, qr_code)
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
      [req.user.id, event_id, ticket_type, reference, event.price_sats, qr_code_url]
    );

    await dbHelper.commit();

    res.status(201).json({
      success: true,
      ticket: {
        id: result.lastID,
        event_id,
        reference,
        qr_code: qr_code_url,
        amount_due: event.price_sats,
        payment_options: {
          full: event.price_sats,
          installment: Math.ceil(event.price_sats / 3)
        }
      }
    });

  } catch (error) {
    await dbHelper.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
});

// Paiement d'un ticket
router.post('/tickets/:id/payments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_sats, payment_hash } = req.body;

    const ticket = await dbHelper.get(
      `SELECT t.*, e.price_sats as total_price
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.id = ? AND t.user_id = ?`,
      [id, req.user.id]
    );
    if (!ticket) throw new Error('Ticket non trouvé');

    if (ticket.status === 'paid') {
      throw new Error('Ce ticket est déjà payé');
    }

    await dbHelper.beginTransaction();

    await dbHelper.run(
      `INSERT INTO payments 
       (ticket_id, amount_sats, payment_hash, status)
       VALUES (?, ?, ?, 'paid')`,
      [id, amount_sats, payment_hash]
    );

    const paymentSummary = await dbHelper.get(
      `SELECT SUM(amount_sats) as total_paid FROM payments
       WHERE ticket_id = ? AND status = 'paid'`,
      [id]
    );

    const total_paid = paymentSummary.total_paid || 0;
    let new_status = 'pending';
    if (total_paid >= ticket.total_price) {
      new_status = 'paid';
    } else if (total_paid > 0) {
      new_status = 'partial';
    }

    await dbHelper.run(
      `UPDATE tickets
       SET amount_paid_sats = ?,
           status = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [total_paid, new_status, id]
    );

    await dbHelper.commit();

    res.json({
      success: true,
      payment: {
        ticket_id: id,
        amount: amount_sats,
        total_paid,
        status: new_status,
        remaining: ticket.total_price - total_paid
      }
    });

  } catch (error) {
    await dbHelper.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
});

// Générer une facture Lightning
router.post('/invoices', authenticate, async (req, res) => {
  try {
    const { ticket_id, amount_sats, memo } = req.body;

    const ticket = await dbHelper.get(
      `SELECT id, total_amount_sats, amount_paid_sats 
       FROM tickets 
       WHERE id = ? AND user_id = ?`,
      [ticket_id, req.user.id]
    );
    if (!ticket) throw new Error('Ticket non trouvé');

    const remaining = ticket.total_amount_sats - (ticket.amount_paid_sats || 0);
    if (amount_sats > remaining) {
      throw new Error(`Le montant demandé dépasse le dû restant (${remaining} SATS)`);
    }

    const invoiceResponse = await axios.post(
      `${process.env.LNBITS_URL}/api/v1/payments`,
      {
        out: false,
        amount: amount_sats,
        memo: memo || `Paiement pour ticket ${ticket_id}`
      },
      {
        headers: {
          'X-Api-Key': process.env.LNBITS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    await dbHelper.run(
      `INSERT INTO invoices
       (ticket_id, payment_request, payment_hash, amount_sats, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [
        ticket_id,
        invoiceResponse.data.payment_request,
        invoiceResponse.data.payment_hash,
        amount_sats
      ]
    );

    res.json({
      success: true,
      invoice: {
        payment_request: invoiceResponse.data.payment_request,
        payment_hash: invoiceResponse.data.payment_hash,
        amount: amount_sats,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      details: error.response?.data || undefined
    });
  }
});

// Valider un ticket (organisateur)
router.get('/tickets/validate/:reference', authenticate, async (req, res) => {
  try {
    const { reference } = req.params;

    if (req.user.role !== 'organizer') {
      throw new Error('Seuls les organisateurs peuvent valider des tickets');
    }

    const ticket = await dbHelper.get(
      `SELECT t.*, e.name as event_name, e.user_id as organizer_id,
              u.name as attendee_name
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN users u ON t.user_id = u.id
       WHERE t.reference = ?`,
      [reference]
    );

    if (!ticket) {
      throw new Error('Ticket non trouvé');
    }

    if (ticket.organizer_id !== req.user.id) {
      throw new Error('Vous ne pouvez pas valider ce ticket');
    }

    if (ticket.status !== 'paid') {
      return res.json({
        valid: false,
        reason: ticket.status === 'pending' ? 'Paiement incomplet' : 'Ticket annulé',
        ticket
      });
    }

    await dbHelper.run(
      `UPDATE tickets SET status = 'used' WHERE id = ?`,
      [ticket.id]
    );

    res.json({
      valid: true,
      ticket: {
        id: ticket.id,
        reference: ticket.reference,
        event_name: ticket.event_name,
        attendee_name: ticket.attendee_name,
        validated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
