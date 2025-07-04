const express = require('express');
const router = express.Router();
const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'eventpay.db');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

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

// Middleware de validation d'événement
const validateEventInput = (req, res, next) => {
  const { name, date, location, ticket_plans } = req.body;
  
  if (!name || !date || !location) {
    return res.status(400).json({ 
      error: 'Champs obligatoires manquants',
      required: ['name', 'date', 'location']
    });
  }

  if (!ticket_plans || ticket_plans.length === 0) {
    return res.status(400).json({ 
      error: 'Au moins un type de billet est requis'
    });
  }

  for (const plan of ticket_plans) {
    if (!plan.type || isNaN(plan.price_sats) || isNaN(plan.quantity)) {
      return res.status(400).json({ 
        error: 'Chaque billet doit avoir un type, un prix et une quantité valides'
      });
    }
  }

  next();
};

// Créer un événement
router.post('/', authenticate, validateEventInput, async (req, res) => {
  let transactionActive = false;
  
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Seuls les organisateurs peuvent créer des événements' });
    }

    const {
      name, description, category, date, time, location, image_url,
      multi_plans = true,
      ticket_plans = [],
      partners = []
    } = req.body;

    await dbHelper.beginTransaction();
    transactionActive = true;

    // Créer l'événement
    const result = await dbHelper.run(
      `INSERT INTO events 
       (user_id, name, description, category, date, time, location, image_url, multi_plans)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, description, category, date, time, location, image_url || null, multi_plans]
    );
    
    const eventId = result.lastID;

    // Insérer les plans/tarifs
    const ticketPromises = ticket_plans.map(plan => 
      dbHelper.run(
        `INSERT INTO ticket_plans (event_id, type, price_sats, quantity)
         VALUES (?, ?, ?, ?)`,
        [eventId, plan.type, plan.price_sats, plan.quantity]
      )
    );

    // Insérer les partenaires
    const partnerPromises = partners.map(partner =>
      dbHelper.run(
        `INSERT INTO partners (event_id, name, logo, description)
         VALUES (?, ?, ?, ?)`,
        [eventId, partner.name, partner.logo || null, partner.description || null]
      )
    );

    await Promise.all([...ticketPromises, ...partnerPromises]);
    await dbHelper.commit();
    transactionActive = false;

    res.status(201).json({
      success: true,
      event_id: eventId,
      message: "Événement créé avec succès !"
    });

  } catch (error) {
    if (transactionActive) {
      await dbHelper.rollback().catch(rollbackError => {
        console.error('Erreur lors du rollback:', rollbackError);
      });
    }

    console.error('Erreur création événement:', error);
    
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Une erreur est survenue lors de la création de l\'événement'
    });
  }
});

// Récupérer les événements d'un organisateur
router.get('/organizer', authenticate, async (req, res) => {
  try {
    const events = await dbHelper.all(
      `SELECT 
        id, 
        name, 
        date, 
        time, 
        location, 
        image_url,
        (SELECT COUNT(*) FROM tickets WHERE event_id = events.id) as tickets_sold
       FROM events 
       WHERE user_id = ? 
       ORDER BY date DESC`,
      [req.user.id]
    );

    const now = new Date();
    const formattedEvents = events.map(event => ({
      ...event,
      status: new Date(event.date) > now ? 'À venir' : 'Terminé',
      formatted_date: new Date(event.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) + (event.time ? ', ' + event.time : '')
    }));

    res.json({
      success: true,
      events: formattedEvents
    });
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des événements'
    });
  }
});

// Récupérer les 2 derniers événements organisateur publiés
router.get('/latest', async (req, res) => {
  try {
    const events = await dbHelper.all(
      `SELECT 
        id, name, date, location, image_url, category
       FROM events 
       ORDER BY datetime(date) DESC 
       LIMIT 2`
    );

    res.json({ success: true, events });
  } catch (error) {
    console.error('Erreur récupération derniers événements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


module.exports = router;