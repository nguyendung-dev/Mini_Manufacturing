const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'mini_manufacturing_erp',
  family: 4, // Force IPv4 so MySQL '%' wildcard matches inside Docker network
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
