const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'eventpay.db');
const db = new sqlite3.Database(dbPath);
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Helper pour les opérations asynchrones sur la base de données
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
  })
};

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Token manquant');

    const user = await dbHelper.get(
      'SELECT id, email, role FROM users WHERE auth_token = ?',
      [token]
    );
    if (!user) throw new Error('Utilisateur non trouvé');

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// Middleware de validation d'événement
const validateEventInput = (req, res, next) => {
  const { name, price_fcfa, date, location } = req.body;
  if (!name || !price_fcfa || !date || !location) {
    return res.status(400).json({ 
      error: 'Champs manquants',
      required: ['name', 'price_fcfa', 'date', 'location']
    });
  }
  next();
};

// Créer un événement avec plans et partenaires
router.post('/events', authenticate, validateEventInput, async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      throw new Error('Seuls les organisateurs peuvent créer des événements');
    }

    const {
      name, description, category, date, time, location, image_url,
      multi_plans = 1,
      ticket_plans = [], // [{type, price_sats, quantity}]
      partners = []      // [{name, logo, description}]
    } = req.body;

    await dbHelper.beginTransaction();

    // Créer l'événement
    const result = await dbHelper.run(
      `INSERT INTO events 
       (user_id, name, description, category, date, time, location, image_url, multi_plans)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, description, category, date, time, location, image_url, multi_plans]
    );
    const eventId = result.lastID;

    // Insérer les plans/tarifs
    for (const plan of ticket_plans) {
      await dbHelper.run(
        `INSERT INTO ticket_plans (event_id, type, price_sats, quantity)
         VALUES (?, ?, ?, ?)`,
        [eventId, plan.type, plan.price_sats, plan.quantity]
      );
    }

    // Insérer les partenaires
    for (const partner of partners) {
      await dbHelper.run(
        `INSERT INTO partners (event_id, name, logo, description)
         VALUES (?, ?, ?, ?)`,
        [eventId, partner.name, partner.logo, partner.description]
      );
    }

    await dbHelper.commit();

    res.status(201).json({
      success: true,
      event_id: eventId,
      message: "Événement créé avec succès !"
    });

  } catch (error) {
    await dbHelper.rollback();
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Réserver un billet
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { event_id, ticket_type = 'standard' } = req.body;

    // Vérifier l'événement
    const event = await dbHelper.get(
      `SELECT id, price_sats FROM events 
       WHERE id = ? AND date > datetime('now')`,
      [event_id]
    );
    if (!event) throw new Error('Événement non trouvé ou terminé');

    // Créer la référence unique
    const reference = `TKT-${uuidv4().substr(0, 8).toUpperCase()}`;
    const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reference)}`;

    await dbHelper.beginTransaction();

    // Créer le ticket
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
          installment: Math.ceil(event.price_sats / 3) // Paiement en 3 fois
        }
      }
    });

  } catch (error) {
    await dbHelper.rollback();
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Paiement d'un ticket
router.post('/tickets/:id/payments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_sats, payment_hash } = req.body;

    // Vérifier le ticket
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

    // Enregistrer le paiement
    await dbHelper.run(
      `INSERT INTO payments 
       (ticket_id, amount_sats, payment_hash, status)
       VALUES (?, ?, ?, 'paid')`,
      [id, amount_sats, payment_hash]
    );

    // Calculer le nouveau statut
    const paymentSummary = await dbHelper.get(
      `SELECT 
       SUM(amount_sats) as total_paid,
       COUNT(*) as payment_count
       FROM payments
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

    // Mettre à jour le ticket
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
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Générer une facture Lightning
router.post('/invoices', authenticate, async (req, res) => {
  try {
    const { ticket_id, amount_sats, memo } = req.body;

    // Vérifier le ticket
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

    // Générer la facture via LNbits
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

    // Enregistrer la facture
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
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1 heure
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

// Route événements featured
router.get('/events', async (req, res) => {
  try {
    const { featured, limit, category } = req.query;
    let query = `
      SELECT e.*, 
      GROUP_CONCAT(c.name) as categories
      FROM events e
      LEFT JOIN event_categories ec ON e.id = ec.event_id
      LEFT JOIN categories c ON ec.category_id = c.id
      WHERE e.date > datetime('now')
    `;

    const params = [];
    if (featured === 'true') {
      query += ' AND e.featured = 1';
    }
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }

    query += ' GROUP BY e.id ORDER BY e.date ASC';
    if (limit) query += ` LIMIT ${parseInt(limit)}`;

    const events = await db.all(query, params);
    res.json(events.map(e => ({
      ...e,
      categories: e.categories ? e.categories.split(',') : []
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les tickets d'un utilisateur
router.get('/users/tickets', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT t.*,
      e.name as event_name,
      e.date as event_date,
      e.location as event_location,
      e.image_url as event_image,
      u.name as organizer_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE t.user_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY e.date DESC';

    const tickets = await dbHelper.all(query, params);

    res.json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(t => ({
        ...t,
        payment_progress: Math.round((t.amount_paid_sats / t.total_amount_sats) * 100)
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Valider un ticket (pour organisateurs)
router.get('/tickets/validate/:reference', authenticate, async (req, res) => {
  try {
    const { reference } = req.params;

    // Vérifier que l'utilisateur est organisateur
    if (req.user.role !== 'organizer') {
      throw new Error('Seuls les organisateurs peuvent valider des tickets');
    }

    const ticket = await dbHelper.get(
      `SELECT t.*,
       e.name as event_name,
       e.user_id as organizer_id,
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

    // Vérifier que l'organisateur est bien le propriétaire de l'événement
    if (ticket.organizer_id !== req.user.id) {
      throw new Error('Vous ne pouvez pas valider les tickets de cet événement');
    }

    if (ticket.status !== 'paid') {
      return res.json({
        valid: false,
        reason: ticket.status === 'pending' ? 
               'Paiement incomplet' : 'Ticket annulé',
        ticket: {
          id: ticket.id,
          reference: ticket.reference,
          event_name: ticket.event_name,
          attendee_name: ticket.attendee_name,
          status: ticket.status
        }
      });
    }

    // Marquer le ticket comme utilisé (optionnel)
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
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Nouvelle route pour les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;