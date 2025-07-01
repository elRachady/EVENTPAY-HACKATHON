const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3005;

// Import des routes
const lightningRouter = require('./routes/lightning.route');
const ticketsRouter = require('./routes/tickets.route');
const smsRouter = require('./routes/sms.route');
const { errorHandler } = require('./middleware/errorHandler.middleware');



console.log('Type de lightningRouter:', typeof require('./routes/lightning.route'));
console.log('Type de ticketsRouter:', typeof require('./routes/tickets.route'));
console.log('Type de smsRouter:', typeof require('./routes/sms.route'));

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

// Limite de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requêtes par IP
});
app.use(limiter);

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/home.html'));
});

// Routes API
app.use('/api/lightning', lightningRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/sms', smsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Tickets Sats Bénin',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs
app.use(errorHandler);

// Route fallback
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint non trouvé',
    documentation: '/api/docs' // À implémenter plus tard
  });
});


// Démarrage du serveur
app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development';
  const localUrl = `http://localhost:${PORT}`;
  const lnbitsUrl = process.env.LNBITS_NODE_URL || 'Non configuré dans .env';

  console.log(`
████████╗██╗ ██████╗████████╗███████╗███████╗ █████╗ ████████╗███████╗
╚══██╔══╝██║██╔════╝╚══██╔══╝██╔════╝██╔════╝██╔══██╗╚══██╔══╝██╔════╝
   ██║   ██║██║        ██║   █████╗  ███████╗███████║   ██║   ███████╗
   ██║   ██║██║        ██║   ██╔══╝  ╚════██║██╔══██║   ██║   ╚════██║
   ██║   ██║╚██████╗   ██║   ███████╗███████║██║  ██║   ██║   ███████║
   ╚═╝   ╚═╝ ╚═════╝   ╚═╝   ╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
  `);

  console.log(`🚀 Serveur démarré avec succès`);
  console.log(`⚡ Environnement: ${env}`);
  console.log(`🌍 Accès local: ${localUrl}`);
  console.log(`📡 LNbits: ${lnbitsUrl}`);
  console.log(`⏱ ${new Date().toLocaleString()}\n`);


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
  console.log(`GET    /health                         → Statut du service`);
  console.log(`\n=================================`);
});