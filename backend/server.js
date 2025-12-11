import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initialize, close } from './db/oracle.js';

// Import routes
import customersRouter from './routes/customers.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import inventoryRouter from './routes/inventory.js';
import manufacturersRouter from './routes/manufacturers.js';
import categoriesRouter from './routes/categories.js';
import accountsRouter from './routes/accounts.js';
import paymentsRouter from './routes/payments.js';
import shipmentsRouter from './routes/shipments.js';
import locationsRouter from './routes/locations.js';
import orderLinesRouter from './routes/orderLines.js';
import paymentCardsRouter from './routes/paymentCards.js';
import shippersRouter from './routes/shippers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/manufacturers', manufacturersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/order-lines', orderLinesRouter);
app.use('/api/payment-cards', paymentCardsRouter);
app.use('/api/shippers', shippersRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database connection and start server
async function startServer() {
  try {
    await initialize();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🔗 CORS enabled for: ${CORS_ORIGIN}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await close();
  process.exit(0);
});

startServer();

