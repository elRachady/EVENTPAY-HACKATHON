
const axios = require('axios');

class LNbitsService {
  constructor() {
    this.baseURL = process.env.LNBITS_NODE_URL;
    this.adminKey = process.env.LNBITS_ADMIN_KEY;
    this.invoiceKey = process.env.LNBITS_INVOICE_KEY;
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Get wallet balance
  async getWalletBalance() {
    try {
      const response = await this.api.get('/api/v1/wallet', {
        headers: { 'X-Api-Key': this.invoiceKey }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get wallet balance');
    }
  }

  // Create Lightning invoice
  async createInvoice(amount, memo = '', expiry = 3600) {
    try {
      const payload = {
        out: false,
        amount: parseInt(amount),
        memo: memo,
        expiry: expiry
      };

      const response = await this.api.post('/api/v1/payments', payload, {
        headers: { 'X-Api-Key': this.invoiceKey }
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create invoice');
    }
  }

  // Check payment status
  async checkPayment(paymentHash) {
    try {
      const response = await this.api.get(`/api/v1/payments/${paymentHash}`, {
        headers: { 'X-Api-Key': this.invoiceKey }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to check payment status');
    }
  }
  
   // Pay Lightning invoice
  async payInvoice(bolt11) {
    try {
      const payload = {
        out: true,
        bolt11: bolt11
      };

      const response = await this.api.post('/api/v1/payments', payload, {
        headers: { 'X-Api-Key': this.adminKey }
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to pay invoice');
    }
  }

  // Get payment history
  async getPaymentHistory(limit = 50) {
    try {
      const response = await this.api.get(`/api/v1/payments?limit=${limit}`, {
        headers: { 'X-Api-Key': this.invoiceKey }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get payment history');
    }
  }

  // Decode Lightning invoice
  async decodeInvoice(bolt11) {
    try {
      const response = await this.api.post('/api/v1/payments/decode', 
        { data: bolt11 },
        { headers: { 'X-Api-Key': this.invoiceKey } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to decode invoice');
    }
  }

  // Create a new wallet
  async createWallet(walletName, adminId = null) {
    try {
      const payload = {
        name: walletName,
        adminkey: adminId
      };

      const response = await this.api.post('/api/v1/wallet', payload, {
        headers: { 'X-Api-Key': this.adminKey }
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create wallet');
    }
  }

  // Handle errors consistently
  handleError(error, message) {
    console.error(`LNbits Service Error: ${message}`, error.response?.data || error.message);
    
    if (error.response) {
      return new Error(`${message}: ${error.response.data?.detail || error.response.statusText}`);
    }
    return new Error(`${message}: ${error.message}`);
  }
}

module.exports = new LNbitsService();