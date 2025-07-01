const axios = require('axios');
require('dotenv').config();

const LNBITS_API = process.env.LNBITS_URL || 'https://lnbits.com';

const createInvoice = async (amount_sats, memo) => {
  const response = await axios.post(`${LNBITS_API}/api/v1/payments`, {
    out: false,
    amount: amount_sats,
    memo: memo
  }, {
    headers: { 'X-Api-Key': process.env.LNBITS_API_KEY }
  });
  return response.data;
};

const checkInvoice = async (payment_hash) => {
  const response = await axios.get(`${LNBITS_API}/api/v1/payments/${payment_hash}`, {
    headers: { 'X-Api-Key': process.env.LNBITS_API_KEY }
  });
  return response.data;
};

module.exports = { createInvoice, checkInvoice };