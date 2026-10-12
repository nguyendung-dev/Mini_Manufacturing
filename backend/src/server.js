const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDatabase } = require('./init-db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
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
  res.json({ status: 'OK', message: 'Mini Manufacturing ERP Backend is running' });
});

// Start Server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` Mini Manufacturing ERP Backend running on:`);
      console.log(` http://localhost:${PORT}`);
      console.log(` Connected to MySQL (Laragon): localhost:3306`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();
