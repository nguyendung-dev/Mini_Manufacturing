const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_NAME = process.env.DB_NAME || 'mini_manufacturing_erp';

async function initDatabase() {
  console.log('Connecting to MySQL...');
  try {
    const rootConn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT,
      family: 4
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database "${DB_NAME}" checked/created.`);
    await rootConn.end();
  } catch (createErr) {
    console.warn(`Could not run CREATE DATABASE, connecting directly to database "${DB_NAME}":`, createErr.message);
  }

  const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    database: DB_NAME,
    family: 4,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('Creating tables...');

  // 1. Categories
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Warehouses
  await pool.query(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      location VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Items
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      category_id VARCHAR(50),
      unit VARCHAR(50) NOT NULL,
      cost_price DECIMAL(15, 2) DEFAULT 0,
      sale_price DECIMAL(15, 2) DEFAULT 0,
      min_stock DECIMAL(15, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Partners
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partners (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      phone VARCHAR(50),
      address VARCHAR(255),
      debt DECIMAL(15, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Stock
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock (
      id VARCHAR(50) PRIMARY KEY,
      warehouse_id VARCHAR(50) NOT NULL,
      item_id VARCHAR(50) NOT NULL,
      lot_number VARCHAR(100) NOT NULL,
      quantity DECIMAL(15, 2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_wh_item_lot (warehouse_id, item_id, lot_number)
    );
  `);

  // 6. BOMs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS boms (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      target_item_id VARCHAR(50) NOT NULL,
      version VARCHAR(20) DEFAULT '1.0',
      standard_qty DECIMAL(15, 2) DEFAULT 1,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bom_items (
      id VARCHAR(50) PRIMARY KEY,
      bom_id VARCHAR(50) NOT NULL,
      item_id VARCHAR(50) NOT NULL,
      qty DECIMAL(15, 4) NOT NULL DEFAULT 1,
      scrap_rate DECIMAL(8, 2) DEFAULT 0,
      note TEXT
    );
  `);

  // 7. Production Orders
  await pool.query(`
    CREATE TABLE IF NOT EXISTS production_orders (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      date DATE NOT NULL,
      target_item_id VARCHAR(50) NOT NULL,
      bom_id VARCHAR(50),
      planned_qty DECIMAL(15, 2) NOT NULL,
      actual_qty DECIMAL(15, 2) DEFAULT 0,
      defective_qty DECIMAL(15, 2) DEFAULT 0,
      lot_number VARCHAR(100),
      warehouse_id VARCHAR(50),
      status VARCHAR(30) DEFAULT 'DRAFT',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS production_stages (
      id VARCHAR(50) PRIMARY KEY,
      production_order_id VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      stage_order INT DEFAULT 1,
      status VARCHAR(30) DEFAULT 'PENDING',
      completed_qty DECIMAL(15, 2) DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS production_allocations (
      id VARCHAR(50) PRIMARY KEY,
      production_order_id VARCHAR(50) NOT NULL,
      item_id VARCHAR(50) NOT NULL,
      planned_qty DECIMAL(15, 4) NOT NULL,
      allocated_qty DECIMAL(15, 4) DEFAULT 0,
      actual_used_qty DECIMAL(15, 4) DEFAULT 0,
      lot_number VARCHAR(100)
    );
  `);

  // 8. Stock Transactions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_transactions (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      date DATE NOT NULL,
      type VARCHAR(30) NOT NULL,
      status VARCHAR(20) DEFAULT 'DRAFT',
      source_warehouse_id VARCHAR(50),
      dest_warehouse_id VARCHAR(50),
      partner_id VARCHAR(50),
      ref_code VARCHAR(100),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_transaction_items (
      id VARCHAR(50) PRIMARY KEY,
      transaction_id VARCHAR(50) NOT NULL,
      item_id VARCHAR(50) NOT NULL,
      lot_number VARCHAR(100),
      qty DECIMAL(15, 2) NOT NULL,
      price DECIMAL(15, 2) DEFAULT 0
    );
  `);

  // 9. Purchase Orders
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      date DATE NOT NULL,
      partner_id VARCHAR(50) NOT NULL,
      status VARCHAR(30) DEFAULT 'DRAFT',
      total_amount DECIMAL(15, 2) DEFAULT 0,
      paid_amount DECIMAL(15, 2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id VARCHAR(50) PRIMARY KEY,
      order_id VARCHAR(50) NOT NULL,
      item_id VARCHAR(50) NOT NULL,
      qty DECIMAL(15, 2) NOT NULL,
      received_qty DECIMAL(15, 2) DEFAULT 0,
      unit_price DECIMAL(15, 2) DEFAULT 0,
      amount DECIMAL(15, 2) DEFAULT 0
    );
  `);

  // 10. Sales Orders
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      date DATE NOT NULL,
      partner_id VARCHAR(50) NOT NULL,
      status VARCHAR(30) DEFAULT 'DRAFT',
      total_amount DECIMAL(15, 2) DEFAULT 0,
      paid_amount DECIMAL(15, 2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_order_items (
      id VARCHAR(50) PRIMARY KEY,
      order_id VARCHAR(50) NOT NULL,
      item_id VARCHAR(50) NOT NULL,
      qty DECIMAL(15, 2) NOT NULL,
      delivered_qty DECIMAL(15, 2) DEFAULT 0,
      unit_price DECIMAL(15, 2) DEFAULT 0,
      amount DECIMAL(15, 2) DEFAULT 0
    );
  `);

  // 11. Cash Receipts & Payments
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cash_receipts (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      date DATE NOT NULL,
      partner_id VARCHAR(50),
      type VARCHAR(30) DEFAULT 'SALE',
      payment_method VARCHAR(20) DEFAULT 'BANK',
      amount DECIMAL(15, 2) NOT NULL,
      ref_code VARCHAR(100),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cash_payments (
      id VARCHAR(50) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      date DATE NOT NULL,
      partner_id VARCHAR(50),
      type VARCHAR(30) DEFAULT 'PURCHASE',
      payment_method VARCHAR(20) DEFAULT 'BANK',
      amount DECIMAL(15, 2) NOT NULL,
      ref_code VARCHAR(100),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. Cost Calculations
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cost_calculations (
      id VARCHAR(50) PRIMARY KEY,
      production_order_id VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      target_item_code VARCHAR(50),
      target_item_name VARCHAR(255),
      completed_qty DECIMAL(15, 2) NOT NULL,
      material_cost DECIMAL(15, 2) DEFAULT 0,
      labor_cost DECIMAL(15, 2) DEFAULT 0,
      overhead_cost DECIMAL(15, 2) DEFAULT 0,
      total_cost DECIMAL(15, 2) DEFAULT 0,
      unit_cost DECIMAL(15, 2) DEFAULT 0,
      standard_bom_cost DECIMAL(15, 2) DEFAULT 0,
      variance DECIMAL(15, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tables initialized. Checking seed data...');

  const [existingThep] = await pool.query("SELECT COUNT(*) as count FROM items WHERE code LIKE 'NVL-THEP%'");
  const [existingItems] = await pool.query('SELECT COUNT(*) as count FROM items');
  if (existingThep[0].count > 0 || existingItems[0].count === 0) {
    console.log('Seeding initial Woodworking & Furniture ERP data...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE cost_calculations');
    await pool.query('TRUNCATE TABLE cash_payments');
    await pool.query('TRUNCATE TABLE cash_receipts');
    await pool.query('TRUNCATE TABLE sales_order_items');
    await pool.query('TRUNCATE TABLE sales_orders');
    await pool.query('TRUNCATE TABLE purchase_order_items');
    await pool.query('TRUNCATE TABLE purchase_orders');
    await pool.query('TRUNCATE TABLE stock_transaction_items');
    await pool.query('TRUNCATE TABLE stock_transactions');
    await pool.query('TRUNCATE TABLE production_allocations');
    await pool.query('TRUNCATE TABLE production_stages');
    await pool.query('TRUNCATE TABLE production_orders');
    await pool.query('TRUNCATE TABLE bom_items');
    await pool.query('TRUNCATE TABLE boms');
    await pool.query('TRUNCATE TABLE partners');
    await pool.query('TRUNCATE TABLE stock');
    await pool.query('TRUNCATE TABLE items');
    await pool.query('TRUNCATE TABLE warehouses');
    await pool.query('TRUNCATE TABLE categories');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // Seed Categories
    await pool.query(`
      INSERT INTO categories (id, name, type) VALUES
      ('CAT-01', 'Gỗ Tự Nhiên & Ván Công Nghiệp', 'NVL'),
      ('CAT-02', 'Phụ Kiện Ngũ Kim Mộc & Ray Bản Lề', 'NVL'),
      ('CAT-03', 'Sơn PU, Keo Dán & Vật Tư Hoàn Thiện', 'NVL'),
      ('CAT-04', 'Bán Thành Phẩm Mộc Thô (BTP)', 'BTP'),
      ('CAT-05', 'Đồ Gỗ Nội Thất Hoàn Thiện (TP)', 'TP');
    `);

    // Seed Warehouses
    await pool.query(`
      INSERT INTO warehouses (id, code, name, type, location) VALUES
      ('WH-NVL', 'KHO-GO', 'Kho Gỗ Khối & Ván MDF', 'NVL', 'Khu A - Gỗ Sồi, Gỗ Tự Nhiên & Ván MDF An Cường'),
      ('WH-PK', 'KHO-NGUKIM', 'Kho Phụ Kiện Ngũ Kim & Sơn PU', 'NVL', 'Khu B - Bản lề Hafele, Ray trượt, Keo Titebond & Sơn PU'),
      ('WH-BTP', 'KHO-BTP', 'Kho Bán Thành Phẩm Mộc Thô', 'BTP', 'Khu C - Khung chân, mặt bàn phôi mộc sau CNC'),
      ('WH-TP', 'KHO-TP', 'Kho Thành Phẩm Nội Thất', 'TP', 'Khu D - Hàng bọc màng PE chống xước sẵn sàng giao'),
      ('WH-SX', 'KHO-SX', 'Khu Line Sản Xuất & Buồng Sơn PU', 'SX', 'Khu máy xẻ nan, dán cạnh tự động & phòng phun sơn');
    `);

    // Seed Items
    await pool.query(`
      INSERT INTO items (id, code, name, type, category_id, unit, cost_price, sale_price, min_stock) VALUES
      ('ITEM-NVL-01', 'NVL-GO-SOI', 'Gỗ Sồi Trắng Bắc Mỹ (White Oak) Xẻ Sấy 4/4', 'NVL', 'CAT-01', 'm3', 18500000, 0, 2),
      ('ITEM-NVL-02', 'NVL-MDF-AC17', 'Ván MDF Lõi Xanh Chống Ẩm An Cường 17mm (1220x2440)', 'NVL', 'CAT-01', 'Tấm', 385000, 0, 30),
      ('ITEM-NVL-03', 'NVL-BANLE-HF', 'Bản Lề Bật Giảm Chấn Hafele Inox 304', 'NVL', 'CAT-02', 'Cái', 28000, 0, 100),
      ('ITEM-NVL-04', 'NVL-RAY-450', 'Ray Trượt Bi 3 Tầng Giảm Chấn 450mm', 'NVL', 'CAT-02', 'Bộ', 65000, 0, 20),
      ('ITEM-NVL-05', 'NVL-SON-PU', 'Bộ Sơn Lót & Sơn Phủ Bóng PU 2K Oseven', 'NVL', 'CAT-03', 'Bộ', 420000, 0, 10),
      ('ITEM-NVL-06', 'NVL-KEO-TB', 'Keo Ghép Mộng Gỗ Titebond II Premium (Bình 3.78L)', 'NVL', 'CAT-03', 'Bình', 450000, 0, 5),
      ('ITEM-BTP-01', 'BTP-MATBAN-SOI', 'Mặt Bàn Gỗ Sồi Ghép Mộng 1800x900x35mm (Mộc Thô)', 'BTP', 'CAT-04', 'Tấm', 1650000, 0, 5),
      ('ITEM-BTP-02', 'BTP-CHAN-SOI', 'Bộ Khung Chân Bàn Ăn Gỗ Sồi Tiện Rãnh (Mộc Thô)', 'BTP', 'CAT-04', 'Bộ', 850000, 0, 5),
      ('ITEM-BTP-03', 'BTP-THUNGTU-MDF', 'Khoang Thùng Tủ Quần Áo MDF Cắt CNC & Dán Nẹp', 'BTP', 'CAT-04', 'Khoang', 920000, 0, 5),
      ('ITEM-TP-01', 'TP-BANAN-SOI-6G', 'Bàn Ăn Gỗ Sồi Tự Nhiên 6 Ghế Sơn PU Cao Cấp (1m8x0.9m)', 'TP', 'CAT-05', 'Bộ', 5200000, 8500000, 2),
      ('ITEM-TP-02', 'TP-TU-AO-4C', 'Tủ Quần Áo 4 Cánh Kịch Trần MDF An Cường (2m4x2m0)', 'TP', 'CAT-05', 'Chiếc', 6800000, 11500000, 1);
    `);

    // Seed Stock
    await pool.query(`
      INSERT INTO stock (id, warehouse_id, item_id, lot_number, quantity) VALUES
      ('STK-01', 'WH-NVL', 'ITEM-NVL-01', 'LOT-GO-202610-A', 12.5),
      ('STK-02', 'WH-NVL', 'ITEM-NVL-02', 'LOT-MDF-202610', 85),
      ('STK-03', 'WH-PK', 'ITEM-NVL-03', 'LOT-HF-202609', 320),
      ('STK-04', 'WH-PK', 'ITEM-NVL-04', 'LOT-RAY-202609', 45),
      ('STK-05', 'WH-PK', 'ITEM-NVL-05', 'LOT-PU-202610', 18),
      ('STK-06', 'WH-PK', 'ITEM-NVL-06', 'LOT-TB-202610', 12),
      ('STK-07', 'WH-BTP', 'ITEM-BTP-01', 'LOT-BTP-MATBAN-01', 8),
      ('STK-08', 'WH-BTP', 'ITEM-BTP-02', 'LOT-BTP-CHAN-01', 8),
      ('STK-09', 'WH-TP', 'ITEM-TP-01', 'LOT-TP-BANAN-202610', 4),
      ('STK-10', 'WH-TP', 'ITEM-TP-02', 'LOT-TP-TUAO-202610', 2),
      ('STK-11', 'WH-SX', 'ITEM-NVL-01', 'LOT-GO-202610-A', 1.8);
    `);

    // Seed Partners
    await pool.query(`
      INSERT INTO partners (id, code, name, type, phone, address, debt) VALUES
      ('PARTNER-01', 'NCC-ANCUONG', 'Công Ty Cổ Phần Gỗ An Cường', 'SUPPLIER', '0283.862.5727', '279 Nguyễn Tri Phương, P.5, Q.10, TP.HCM', 18500000),
      ('PARTNER-02', 'NCC-GOMY', 'Tổng Kho Gỗ Nhập Khẩu Bắc Mỹ KingWood', 'SUPPLIER', '0913.567.890', 'Cảng Đình Vũ, Hải Phòng', 45000000),
      ('PARTNER-03', 'NCC-HAFELE', 'Công Ty TNHH Hafele Việt Nam', 'SUPPLIER', '0283.911.5678', '9 Nguyễn Minh Hoàng, P.12, Q. Tân Bình, TP.HCM', 5600000),
      ('PARTNER-04', 'KH-VINHOMES', 'BQL Dự Án Căn Hộ Vinhomes Ocean Park (A+ Decor)', 'CUSTOMER', '0903.888.777', 'Khu Đô Thị Vinhomes Ocean Park, Gia Lâm, Hà Nội', 35000000),
      ('PARTNER-05', 'KH-ECOPARK', 'Biệt Thự Vườn Ecopark Grand The Island', 'CUSTOMER', '0988.123.456', 'Khu Đô Thị Ecopark, Văn Giang, Hưng Yên', 0);
    `);

    // Seed BOMs
    await pool.query(`
      INSERT INTO boms (id, code, name, target_item_id, version, standard_qty, notes) VALUES
      ('BOM-01', 'BOM-BANAN-SOI-V1', 'BOM Bàn Ăn Gỗ Sồi 6 Ghế Tự Nhiên (V1.0)', 'ITEM-TP-01', '1.0', 1, 'Định mức tiêu chuẩn cho 1 bộ bàn ăn gỗ sồi hoàn thiện sơn PU'),
      ('BOM-02', 'BOM-MATBAN-SOI-V1', 'BOM Mặt Bàn Gỗ Sồi Ghép Mộng 1m8 (V1.0)', 'ITEM-BTP-01', '1.0', 1, 'Định mức xẻ phôi, ghép mộng & bào phẳng mặt bàn'),
      ('BOM-03', 'BOM-TUAO-MDF-V1', 'BOM Tủ Quần Áo 4 Cánh MDF An Cường (V1.0)', 'ITEM-TP-02', '1.0', 1, 'Định mức ván MDF, bản lề giảm chấn & ray trượt bi');
    `);

    await pool.query(`
      INSERT INTO bom_items (id, bom_id, item_id, qty, scrap_rate, note) VALUES
      ('BI-01', 'BOM-01', 'ITEM-BTP-01', 1, 0, 'Mặt bàn mộc thô'),
      ('BI-02', 'BOM-01', 'ITEM-BTP-02', 1, 0, 'Bộ khung chân mộc thô'),
      ('BI-03', 'BOM-01', 'ITEM-NVL-05', 0.5, 5, 'Bộ sơn lót & bóng PU Oseven (hao hụt 5%)'),
      ('BI-04', 'BOM-01', 'ITEM-NVL-06', 0.1, 0, 'Keo ghép mộng liên kết mộc'),
      ('BI-05', 'BOM-02', 'ITEM-NVL-01', 0.085, 12, 'Gỗ Sồi xẻ sấy FAS (hao hụt xẻ pha phôi 12%)'),
      ('BI-06', 'BOM-02', 'ITEM-NVL-06', 0.15, 2, 'Keo ghép mộng Titebond II ép vam thủy lực'),
      ('BI-07', 'BOM-03', 'ITEM-NVL-02', 4.5, 4, 'Ván MDF lõi xanh 17mm An Cường'),
      ('BI-08', 'BOM-03', 'ITEM-NVL-03', 16, 0, 'Bản lề bật giảm chấn Hafele'),
      ('BI-09', 'BOM-03', 'ITEM-NVL-04', 3, 0, 'Bộ ray trượt ngăn kéo 450mm');
    `);

    // Seed Production Orders
    await pool.query(`
      INSERT INTO production_orders (id, code, date, target_item_id, bom_id, planned_qty, actual_qty, defective_qty, lot_number, warehouse_id, status, notes) VALUES
      ('LSX-202610-001', 'LSX-202610-001', '2026-10-10', 'ITEM-TP-01', 'BOM-01', 10, 4, 0, 'LOT-TP-BANAN-202610', 'WH-TP', 'IN_PROGRESS', 'Sản xuất 10 bộ bàn ăn gỗ sồi giao dự án căn hộ Vinhomes Ocean Park'),
      ('LSX-202610-002', 'LSX-202610-002', '2026-10-05', 'ITEM-BTP-01', 'BOM-02', 15, 15, 0, 'LOT-BTP-MATBAN-01', 'WH-BTP', 'COMPLETED', 'Gia công sẵn 15 mặt bàn gỗ sồi ghép mộng chuẩn bị cho đơn hàng mùa cưới');
    `);

    await pool.query(`
      INSERT INTO production_stages (id, production_order_id, name, stage_order, status, completed_qty) VALUES
      ('STG-01', 'LSX-202610-001', 'Xẻ phôi & Bào thẩm 4 mặt', 1, 'COMPLETED', 10),
      ('STG-02', 'LSX-202610-001', 'Ghép mộng & Ráp khung bàn mộc thô', 2, 'COMPLETED', 10),
      ('STG-03', 'LSX-202610-001', 'Chà nhám làm nguội P180/P240', 3, 'COMPLETED', 8),
      ('STG-04', 'LSX-202610-001', 'Sơn lót & Phủ bóng PU 2K Oseven', 4, 'IN_PROGRESS', 4),
      ('STG-05', 'LSX-202610-001', 'KCS & Bọc màng PE xuất xưởng', 5, 'PENDING', 0),
      ('STG-06', 'LSX-202610-002', 'Rong xẻ nan gỗ theo quy cách', 1, 'COMPLETED', 15),
      ('STG-07', 'LSX-202610-002', 'Bôi keo Titebond ép vam thủy lực', 2, 'COMPLETED', 15),
      ('STG-08', 'LSX-202610-002', 'Bào phẳng 2 mặt & Cắt tề đầu CNC', 3, 'COMPLETED', 15);
    `);

    await pool.query(`
      INSERT INTO production_allocations (id, production_order_id, item_id, planned_qty, allocated_qty, actual_used_qty, lot_number) VALUES
      ('AL-01', 'LSX-202610-001', 'ITEM-BTP-01', 10, 10, 10, 'LOT-BTP-MATBAN-01'),
      ('AL-02', 'LSX-202610-001', 'ITEM-BTP-02', 10, 10, 10, 'LOT-BTP-CHAN-01'),
      ('AL-03', 'LSX-202610-001', 'ITEM-NVL-05', 5.25, 6, 2.5, 'LOT-PU-202610'),
      ('AL-04', 'LSX-202610-001', 'ITEM-NVL-06', 1, 1, 0.4, 'LOT-TB-202610'),
      ('AL-05', 'LSX-202610-002', 'ITEM-NVL-01', 1.428, 1.5, 1.45, 'LOT-GO-202610-A'),
      ('AL-06', 'LSX-202610-002', 'ITEM-NVL-06', 2.295, 2.5, 2.3, 'LOT-TB-202610');
    `);

    // Seed Stock Transactions
    await pool.query(`
      INSERT INTO stock_transactions (id, code, date, type, status, source_warehouse_id, dest_warehouse_id, partner_id, ref_code, note) VALUES
      ('ST-01', 'PNK-202610-001', '2026-10-02', 'IN_PURCHASE', 'POSTED', NULL, 'WH-NVL', 'PARTNER-02', 'PO-202610-01', 'Nhập kho lô Gỗ Sồi Bắc Mỹ xẻ sấy từ KingWood'),
      ('ST-02', 'PXK-202610-001', '2026-10-05', 'TRANSFER', 'POSTED', 'WH-NVL', 'WH-SX', NULL, 'LSX-202610-002', 'Xuất cấp phát Gỗ Sồi ra xưởng mộc phục vụ LSX-202610-002'),
      ('ST-03', 'PNK-202610-002', '2026-10-07', 'IN_PRODUCTION', 'POSTED', 'WH-SX', 'WH-BTP', NULL, 'LSX-202610-002', 'Nhập kho 15 Mặt Bàn Gỗ Sồi mộc hoàn thành từ LSX-202610-002');
    `);

    await pool.query(`
      INSERT INTO stock_transaction_items (id, transaction_id, item_id, lot_number, qty, price) VALUES
      ('STI-01', 'ST-01', 'ITEM-NVL-01', 'LOT-GO-202610-A', 14, 18500000),
      ('STI-02', 'ST-02', 'ITEM-NVL-01', 'LOT-GO-202610-A', 1.5, 18500000),
      ('STI-03', 'ST-03', 'ITEM-BTP-01', 'LOT-BTP-MATBAN-01', 15, 1650000);
    `);

    // Seed Purchase Orders & Sales Orders
    await pool.query(`
      INSERT INTO purchase_orders (id, code, date, partner_id, status, total_amount, paid_amount, notes) VALUES
      ('PO-202610-01', 'PO-202610-01', '2026-10-01', 'PARTNER-02', 'RECEIVED', 259000000, 100000000, 'Đơn mua 14 m3 Gỗ Sồi Bắc Mỹ FAS xẻ sấy phục vụ sản xuất Quý 4'),
      ('PO-202610-02', 'PO-202610-02', '2026-10-08', 'PARTNER-01', 'CONFIRMED', 38500000, 15000000, 'Đặt mua 100 tấm Ván MDF An Cường chống ẩm 17mm');
    `);

    await pool.query(`
      INSERT INTO purchase_order_items (id, order_id, item_id, qty, received_qty, unit_price, amount) VALUES
      ('POI-01', 'PO-202610-01', 'ITEM-NVL-01', 14, 14, 18500000, 259000000),
      ('POI-02', 'PO-202610-02', 'ITEM-NVL-02', 100, 0, 385000, 38500000);
    `);

    await pool.query(`
      INSERT INTO sales_orders (id, code, date, partner_id, status, total_amount, paid_amount, notes) VALUES
      ('SO-202610-01', 'SO-202610-01', '2026-10-09', 'PARTNER-04', 'CONFIRMED', 85000000, 25000000, 'Hợp đồng cung cấp 10 Bộ bàn ăn gỗ sồi tự nhiên cho dự án Vinhomes');
    `);

    await pool.query(`
      INSERT INTO sales_order_items (id, order_id, item_id, qty, delivered_qty, unit_price, amount) VALUES
      ('SOI-01', 'SO-202610-01', 'ITEM-TP-01', 10, 0, 8500000, 85000000);
    `);

    // Seed Cash Receipts & Payments
    await pool.query(`
      INSERT INTO cash_receipts (id, code, date, partner_id, type, payment_method, amount, ref_code, note) VALUES
      ('PT-202610-01', 'PT-202610-01', '2026-10-09', 'PARTNER-04', 'SALE', 'BANK', 25000000, 'SO-202610-01', 'Thu tạm ứng đợt 1 hợp đồng bàn ăn gỗ sồi Vinhomes Ocean Park');
    `);

    await pool.query(`
      INSERT INTO cash_payments (id, code, date, partner_id, type, payment_method, amount, ref_code, note) VALUES
      ('PC-202610-01', 'PC-202610-01', '2026-10-03', 'PARTNER-02', 'PURCHASE', 'BANK', 100000000, 'PO-202610-01', 'Thanh toán tiền mua gỗ sồi KingWood đợt 1'),
      ('PC-202610-02', 'PC-202610-02', '2026-10-06', NULL, 'OVERHEAD', 'CASH', 4500000, 'CHI-XUONG', 'Tiền điện 3 pha buồng sơn & máy xẻ gỗ tuần 1 tháng 10');
    `);

    // Seed Cost Calculations
    await pool.query(`
      INSERT INTO cost_calculations (id, production_order_id, date, target_item_code, target_item_name, completed_qty, material_cost, labor_cost, overhead_cost, total_cost, unit_cost, standard_bom_cost, variance) VALUES
      ('COST-01', 'LSX-202610-002', '2026-10-07', 'BTP-MATBAN-SOI', 'Mặt Bàn Gỗ Sồi Ghép Mộng 1800x900x35mm (Mộc Thô)', 15, 23925000, 3000000, 1500000, 28425000, 1895000, 1920000, -25000);
    `);

    console.log('Woodworking seed data inserted successfully!');
  }

  await pool.end();
  console.log('Database initialization completed!');
}

if (require.main === module) {
  initDatabase().catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
}

module.exports = { initDatabase };
