const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDatabase } = require('./init-db');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration for Coolify domains
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Import Routes
const catalogRoutes = require('./routes/catalog');
const inventoryRoutes = require('./routes/inventory');
const bomRoutes = require('./routes/boms');
const productionRoutes = require('./routes/production');
const orderRoutes = require('./routes/orders');
const financeRoutes = require('./routes/finance');
const costingRoutes = require('./routes/costings');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/costings', costingRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Mini Manufacturing ERP Backend is running',
    timestamp: new Date().toISOString(),
    db_host: process.env.DB_HOST || 'localhost',
    port: PORT
  });
});

// Start Server (Bind to 0.0.0.0 for Docker container routing)
function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(` Mini Manufacturing ERP Backend running on:`);
    console.log(` Port: ${PORT} (0.0.0.0)`);
    console.log(` Connected to MySQL: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    console.log(`===============================================`);
  });

  // Run database initialization in background
  initDatabase()
    .then(() => {
      console.log('Database and seed tables verified successfully.');
    })
    .catch((err) => {
      console.error('Warning: Database initialization failed:', err.message);
    });
}

startServer();
