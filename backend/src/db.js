const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'mini_manufacturing_erp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

async function query(sql, params = []) {
  const [results] = await pool.query(sql, params);
  return results;
}

async function getConnection() {
  return await pool.getConnection();
}

module.exports = {
  pool,
  query,
  getConnection
};
