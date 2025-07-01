# ⚡ LNbits Lightning Network API

A Node.js Express API that demonstrates Lightning Network functionality using LNbits. 🚀

## Features ✨

- ⚡ Create Lightning invoices
- ✅ Check payment status
- 💸 Pay Lightning invoices
- 💰 Get wallet balance
- 📜 View payment history
- 🔍 Decode Lightning invoices
- 🆕 Create new wallets
- 🛡️ Rate limiting and security middleware


## Backend Infra using docker 
Make sure you have docker running then download the lnbits image from docker 

```
docker run --detach --publish 5000:5000 --name lnbits --volume ${PWD}/.env:/app/.env lnbits/lnbits
```

Go to the `http://localhost:5000` -> In settings -> Funding -> Active Funding -> FakeWallet or another node...
## Setup 🛠️

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   MINT_LIGHTNING_BACKEND=CoreLightningWallet
   LNBITS_URL=http://localhost:5000
   LNBITS_ADMIN_KEY=your_admin_key_here
   LNBITS_INVOICE_KEY=your_invoice_key_here
   PORT=3000
   NODE_ENV=development
   ```

3. Start the server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints 📡

### Wallet Operations 👛
- `GET /api/lightning/balance` - Get wallet balance
- `POST /api/lightning/wallet/create` - Create new wallet

### Invoice Operations 🧾
- `POST /api/lightning/invoice/create` - Create Lightning invoice
- `POST /api/lightning/invoice/pay` - Pay Lightning invoice
- `POST /api/lightning/invoice/decode` - Decode Lightning invoice

### Payment Operations 💳
- `GET /api/lightning/payment/:paymentHash` - Check payment status
- `GET /api/lightning/payments` - Get payment history

### Health Check 🩺
- `GET /health` - Service health status

## Example Usage 🧑‍💻

### Create Invoice
```bash
curl -X POST http://localhost:3000/api/lightning/invoice/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "memo": "Test payment",
    "expiry": 3600
  }'
```

### Check Balance
```bash
curl http://localhost:3000/api/lightning/balance
```

### Pay Invoice
```bash
curl -X POST http://localhost:3000/api/lightning/invoice/pay \
  -H "Content-Type: application/json" \
  -d '{
    "bolt11": "lnbc..."
  }'
```

## Security Features 🔒

- ⏳ Rate limiting (100 requests per 15 minutes)
- 🪖 Helmet.js security headers
- 🧹 Input validation
- 🛑 Error handling middleware
- 🌐 CORS enabled

## Notes 📝

- Uses LNbits demo server by default
- Requires valid LNbits API keys
- Includes comprehensive error handling
- Ready for production deployment 🚀