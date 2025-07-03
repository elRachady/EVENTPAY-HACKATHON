const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

// Charge .env à la racine de /backend
dotenv.config();

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares essentiels
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: {
    error: 'Trop de requêtes',
    message: 'Veuillez réessayer plus tard'
  }
});
app.use(limiter);

// Import des routes (CommonJS)
const lightningRouter = require('./routes/lightning.route.js');
const ticketsRouter = require('./routes/tickets.route.js');
const smsRouter = require('./routes/sms.route.js');
const usersRouter = require('./routes/users.route.js');

// Configuration LNbits (doit être AVANT les routes)
app.use((req, res, next) => {
  req.lnbitsConfig = {
    url: process.env.LNBITS_NODE_URL,
    adminKey: process.env.LNBITS_ADMIN_KEY,
    invoiceKey: process.env.LNBITS_INVOICE_KEY,
    walletId: process.env.LNBITS_WALLET_ID
  };
  next();
});

// Routes API
app.use('/api/lightning', lightningRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/sms', smsRouter);
app.use('/api/users', usersRouter);

// Servir le frontend en production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Tickets Sats Bénin',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    lnbits: {
      node: process.env.LNBITS_NODE_URL,
      wallet: process.env.LNBITS_WALLET_ID?.slice(0, 6) + '...'
    }
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint non trouvé',
    documentation: '/api/docs'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`⚡ Environnement: ${process.env.NODE_ENV}`);
  console.log(`🌍 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📡 LNbits: ${process.env.LNBITS_NODE_URL}`);
  console.log(`⏱ ${new Date().toLocaleString()}`);

  console.log('=== ENDPOINTS DISPONIBLES ===');
  
  // Lightning Network
  console.log('\n⚡ Lightning Network:');
  console.log(`GET    /api/lightning/balance          → Solde du portefeuille`);
  console.log(`POST   /api/lightning/invoice/create   → Créer une facture Lightning`);
  console.log(`POST   /api/lightning/invoice/pay      → Payer une facture`);
  
  // Tickets
  console.log('\n🎫 Gestion des billets:');
  console.log(`POST   /api/tickets/event              → Créer un événement`);
  console.log(`POST   /api/tickets/reserve            → Réserver un billet`);
  console.log(`POST   /api/tickets/pay                → Paiement fractionné`);
  console.log(`GET    /api/tickets/validate/:code     → Valider un billet`);
  
  // SMS
  console.log('\n📱 Notifications SMS:');
  console.log(`POST   /api/sms/notification           → Envoyer une notification`);
  
  // Système
  console.log('\n🛠 Système:');
  console.log(`GET    /api/health                         → Statut du service`);
  console.log(`\n=================================`);
});