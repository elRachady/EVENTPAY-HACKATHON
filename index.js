// index.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { LNBITS_API_KEY, LNBITS_API_URL } = require('./config');

const app = express();
app.use(bodyParser.json());

const db = new sqlite3.Database('./tickets.db');

// ✅ Création d’un ticket
app.post('/tickets', async (req, res) => {
  const { montant_total, public_key, date_limite } = req.body;
  const id = uuidv4();

  try {
    // Enregistrer le ticket avec montant_acquitte = 0
    db.run(`
      INSERT INTO tickets (id, public_key, montant_total, montant_acquitte, date_limite, statut)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, public_key, montant_total, 0, date_limite, 'réservé']);

    // Générer une invoice (par ex. acompte de 1000 sats)
    const invoice = await axios.post(`${LNBITS_API_URL}/payments`, {
      out: false,
      amount: 1000, // acompte initial, en sats
      memo: `Acompte Ticket #${id}`,
      webhook: `http://localhost:3000/webhook`, // à créer ensuite
      internal: false
    }, {
      headers: {
        'X-Api-Key': LNBITS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Retourner l’URL de paiement LNbits
    res.json({
      ticket_id: id,
      payment_request: invoice.data.payment_request,
      pay_link: invoice.data.payment_hash ? `${LNBITS_API_URL}/payinvoice/${invoice.data.payment_hash}` : null
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Erreur lors de la création du ticket ou de l’invoice' });
  }
});

// webhook LNbits
app.post('/webhook', async (req, res) => {
  try {
    // LNbits envoie la notif de paiement dans le corps
    const { payment_hash, payment_request, amount, memo } = req.body;

    console.log("🔔 Webhook LNbits reçu :", req.body);

    // Retrouver le ticket_id à partir du memo
    // par exemple tu stockes dans le memo : "Acompte Ticket #ticketID"
    const match = memo.match(/Ticket #(.+)/);
    if (!match) {
      return res.status(400).json({ error: "Ticket ID introuvable dans le memo" });
    }
    const ticket_id = match[1];

    // Mettre à jour la somme cumulée
    db.get(`SELECT montant_acquitte, montant_total FROM tickets WHERE id = ?`, [ticket_id], (err, ticket) => {
      if (err || !ticket) {
        console.error("Ticket non trouvé :", err);
        return res.status(404).json({ error: "Ticket introuvable" });
      }

      const nouveau_montant = ticket.montant_acquitte + amount;
      let statut = ticket.statut;

      if (nouveau_montant >= ticket.montant_total) {
        statut = "validé";
      }

      db.run(`UPDATE tickets SET montant_acquitte = ?, statut = ? WHERE id = ?`,
        [nouveau_montant, statut, ticket_id],
        (updateErr) => {
          if (updateErr) {
            console.error("Erreur mise à jour :", updateErr);
            return res.status(500).json({ error: "Mise à jour échouée" });
          }

          console.log(`✅ Ticket ${ticket_id} mis à jour : ${nouveau_montant} sats / statut: ${statut}`);
          res.json({ ok: true });
        }
      );
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur dans le webhook" });
  }
});


app.listen(3000, () => {
  console.log('✅ API Node.js en ligne sur http://localhost:3000');
});
