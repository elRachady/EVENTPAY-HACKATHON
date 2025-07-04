// backend/src/utils/seedEvents.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('eventpay.db');

const USER_ID = 1; // Alice

const events = [
  // Bitcoin Mastermind 2025 Passes
  {
    name: 'Bitcoin Mastermind 2025 - Student Pass',
    description: 'Pass étudiant pour Bitcoin Mastermind 2025',
    price_fcfa: 18000,
    price_sats: Math.round(18000 * 0.4),
    date: '2025-07-04',
    location: 'AZALAÏ HOTEL COTONOU - Bénin',
    image_url: '/uploads/bitcoinmastermind.jpg',
    user_id: USER_ID
  },
  {
    name: 'Bitcoin Mastermind 2025 - Semi Pass',
    description: 'Pass semi pour Bitcoin Mastermind 2025',
    price_fcfa: 58000,
    price_sats: Math.round(58000 * 0.4),
    date: '2025-07-04',
    location: 'AZALAÏ HOTEL COTONOU - Bénin',
    image_url: '/uploads/bitcoinmastermind.jpg',
    user_id: USER_ID
  },
  {
    name: 'Bitcoin Mastermind 2025 - Full Pass',
    description: 'Pass complet pour Bitcoin Mastermind 2025',
    price_fcfa: 98000,
    price_sats: Math.round(98000 * 0.4),
    date: '2025-07-04',
    location: 'AZALAÏ HOTEL COTONOU - Bénin',
    image_url: '/uploads/bitcoinmastermind.jpg',
    user_id: USER_ID
  },
  // Other events from your frontend
  {
    name: 'Concert Yemi Alade',
    description: 'Concert exceptionnel de Yemi Alade',
    price_fcfa: 25000,
    price_sats: Math.round(25000 * 0.4),
    date: '2025-07-12',
    location: 'Canal Olympia, Cotonou',
    image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80',
    user_id: USER_ID
  },
  {
    name: 'Championnat National de Football',
    description: 'Championnat national de football',
    price_fcfa: 5000,
    price_sats: Math.round(5000 * 0.4),
    date: '2025-07-20',
    location: 'Stade de l’Amitié',
    image_url: 'https://images.unsplash.com/photo-1505843273132-bc5c6e6e6c8e?auto=format&fit=crop&w=500&q=80',
    user_id: USER_ID
  },
  {
    name: 'Conférence Tech Africa',
    description: 'Conférence Tech Africa',
    price_fcfa: 10000,
    price_sats: Math.round(10000 * 0.4),
    date: '2025-08-05',
    location: 'Novotel, Cotonou',
    image_url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=500&q=80',
    user_id: USER_ID
  },
  {
    name: 'Festival Wémèxwé',
    description: 'Festival Wémèxwé',
    price_fcfa: 8000,
    price_sats: Math.round(8000 * 0.4),
    date: '2025-08-18',
    location: 'Sè',
    image_url: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=500&q=80',
    user_id: USER_ID
  },
  {
    name: 'Salon International du Tourisme',
    description: 'Salon International du Tourisme',
    price_fcfa: 10000,
    price_sats: Math.round(10000 * 0.4),
    date: '2025-12-02',
    location: 'Cotonou',
    image_url: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=500&q=80',
    user_id: USER_ID
  },
  {
    name: 'Festival Voodoo 2023',
    description: 'Festival Voodoo 2023',
    price_fcfa: 50000,
    price_sats: Math.round(50000 * 0.4),
    date: '2023-11-24',
    location: 'Ouidah',
    image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    user_id: USER_ID
  },
  {
    name: 'Concert Angélique Kidjo',
    description: 'Concert Angélique Kidjo',
    price_fcfa: 20000,
    price_sats: Math.round(20000 * 0.4),
    date: '2023-12-20',
    location: 'Palais des Congrès',
    image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    user_id: USER_ID
  }
];

db.serialize(() => {
  events.forEach(event => {
    db.run(
      `INSERT INTO events (user_id, name, description, price_fcfa, price_sats, date, location, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [event.user_id, event.name, event.description, event.price_fcfa, event.price_sats, event.date, event.location, event.image_url],
      function(err) {
        if (err) {
          console.error('Erreur lors de l\'insertion de l\'événement:', event.name, err.message);
        } else {
          console.log('Événement inséré:', event.name);
        }
      }
    );
  });
});

db.close();
