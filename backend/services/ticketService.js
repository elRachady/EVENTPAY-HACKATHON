const crypto = require('crypto');
const db = require('../models/db');
const { generateQR } = require('./qrService');

// Clé privée (à stocker de manière sécurisée dans .env !)
const PRIVATE_KEY = process.env.TICKETSATS_PRIVATE_KEY || crypto.generateKeyPairSync('ec', {
  namedCurve: 'secp256k1'
}).privateKey.export({ type: 'pkcs8', format: 'pem' });

// Générer un ticket signé
const generateSecureTicket = async (event_id, buyer_ln_address, amount_paid, total_amount) => {
  const ticket_id = `TK-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const secret_salt = crypto.randomBytes(16).toString('hex');
  
  // Données du ticket
  const ticketData = {
    event_id,
    ticket_id,
    buyer_ln_address,
    partial_payments: `${amount_paid}/${total_amount} sats`,
    timestamp: Date.now()
  };

  // Signature ECDSA
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(ticketData) + secret_salt);
  sign.end();
  const signature = sign.sign(PRIVATE_KEY, 'base64');

  // Stocker en base de données
  await db.run(
    `INSERT INTO tickets 
     (event_id, ticket_id, secret_salt, signature, status) 
     VALUES (?, ?, ?, ?, 'unused')`,
    [event_id, ticket_id, secret_salt, signature]
  );

  // Générer QR code
  const qrData = {
    ...ticketData,
    signature,
    checksum: crypto.createHash('sha256').update(ticket_id + secret_salt).digest('hex')
  };
  
  return {
    qr_code: await generateQR(JSON.stringify(qrData)),
    ticket_id
  };
};

module.exports = { generateSecureTicket };