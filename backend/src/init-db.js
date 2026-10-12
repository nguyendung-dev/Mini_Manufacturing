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
      port: DB_PORT
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

  const [existingItems] = await pool.query('SELECT COUNT(*) as count FROM items');
  if (existingItems[0].count === 0) {
    console.log('Seeding initial data...');
    // Seed Categories
    await pool.query(`
      INSERT INTO categories (id, name, type) VALUES
      ('CAT-01', 'Thép & Kim loại tấm', 'NVL'),
      ('CAT-02', 'Hóa chất & Sơn', 'NVL'),
      ('CAT-03', 'Phụ kiện cơ khí', 'NVL'),
      ('CAT-04', 'Bán thành phẩm gia công', 'BTP'),
      ('CAT-05', 'Tủ bảng điện hoàn chỉnh', 'TP');
    `);

    // Seed Warehouses
    await pool.query(`
      INSERT INTO warehouses (id, code, name, type, location) VALUES
      ('WH-NVL', 'KHO-NVL', 'Kho Nguyên Vật Liệu', 'NVL', 'Khu A - Tầng 1'),
      ('WH-BTP', 'KHO-BTP', 'Kho Bán Thành Phẩm', 'BTP', 'Khu B - Giữa xưởng'),
      ('WH-TP', 'KHO-TP', 'Kho Thành Phẩm', 'TP', 'Khu C - Cạnh cổng xuất'),
      ('WH-SX', 'KHO-SX', 'Kho Đệm Sản Xuất (Line SX)', 'SX', 'Khu máy dập chấn & lắp ráp');
    `);

    // Seed Items
    await pool.query(`
      INSERT INTO items (id, code, name, type, category_id, unit, cost_price, sale_price, min_stock) VALUES
      ('ITEM-NVL-01', 'NVL-THEP-15', 'Thép Tấm SS400 1.5mm (1200x2400)', 'NVL', 'CAT-01', 'Kg', 22000, 0, 300),
      ('ITEM-NVL-02', 'NVL-SON-XAM', 'Bột Sơn Tĩnh Điện Xám Sần RAL 7035', 'NVL', 'CAT-02', 'Kg', 65000, 0, 50),
      ('ITEM-NVL-03', 'NVL-BULONG-M6', 'Bulong + Tán M6 Inox 304', 'NVL', 'CAT-03', 'Con', 1200, 0, 1000),
      ('ITEM-NVL-04', 'NVL-KHOA-MS', 'Khóa Bật Tay Gạt Tủ Điện MS818', 'NVL', 'CAT-03', 'Bộ', 32000, 0, 50),
      ('ITEM-BTP-01', 'BTP-KHUNG-4060', 'Khung Thân Tủ 400x600 (Đã Cắt Chấn)', 'BTP', 'CAT-04', 'Cái', 145000, 0, 10),
      ('ITEM-BTP-02', 'BTP-CANH-4060', 'Cánh Tủ 400x600 (Đã Đột Lỗ Đèn Báo)', 'BTP', 'CAT-04', 'Cái', 62000, 0, 10),
      ('ITEM-TP-01', 'TP-TU-406020', 'Vỏ Tủ Điện Trong Nhà 400x600x200mm', 'TP', 'CAT-05', 'Chiếc', 298000, 480000, 5),
      ('ITEM-TP-02', 'TP-TU-507025', 'Vỏ Tủ Điện Ngoài Trời Mái Che 500x700x250mm', 'TP', 'CAT-05', 'Chiếc', 420000, 690000, 3);
    `);

    // Seed Stock
    await pool.query(`
      INSERT INTO stock (id, warehouse_id, item_id, lot_number, quantity) VALUES
      ('STK-01', 'WH-NVL', 'ITEM-NVL-01', 'LOT-THEP-202610A', 850),
      ('STK-02', 'WH-NVL', 'ITEM-NVL-02', 'LOT-SON-202610', 120),
      ('STK-03', 'WH-NVL', 'ITEM-NVL-03', 'LOT-BL-202609', 2500),
      ('STK-04', 'WH-NVL', 'ITEM-NVL-04', 'LOT-KH-202609', 80),
      ('STK-05', 'WH-BTP', 'ITEM-BTP-01', 'LOT-BTP-202610-01', 25),
      ('STK-06', 'WH-BTP', 'ITEM-BTP-02', 'LOT-BTP-202610-02', 20),
      ('STK-07', 'WH-TP', 'ITEM-TP-01', 'LOT-TP-202610-01', 12),
      ('STK-08', 'WH-TP', 'ITEM-TP-02', 'LOT-TP-202610-02', 6),
      ('STK-09', 'WH-SX', 'ITEM-NVL-01', 'LOT-THEP-202610A', 55);
    `);

    // Seed Partners
    await pool.query(`
      INSERT INTO partners (id, code, name, type, phone, address, debt) VALUES
      ('PARTNER-01', 'NCC-HOAPHAT', 'Công Ty Cổ Phần Thép Hòa Phát', 'SUPPLIER', '0243.987.6543', 'KCN Phố Nối A, Hưng Yên', 12000000),
      ('PARTNER-02', 'NCC-AKZO', 'Công Ty TNHH Sơn AkzoNobel Việt Nam', 'SUPPLIER', '0283.829.1122', 'KCN Amata, Đồng Nai', 4500000),
      ('PARTNER-03', 'KH-METANBINH', 'Công Ty TNHH Cơ Điện & Chiếu Sáng Tân Bình', 'CUSTOMER', '0903.123.456', '45 Trường Chinh, Q. Tân Bình, TP.HCM', 7200000),
      ('PARTNER-04', 'KH-DIENLUC', 'Xí Nghiệp Xây Lắp Điện Lực Miền Nam', 'CUSTOMER', '0912.888.999', 'Số 10 Nguyễn Huệ, Quận 1, TP.HCM', 0);
    `);

    // Seed BOMs
    await pool.query(`
      INSERT INTO boms (id, code, name, target_item_id, version, standard_qty, notes) VALUES
      ('BOM-01', 'BOM-TP-406020-V1', 'BOM Vỏ Tủ Điện Trong Nhà 400x600x200 (V1.0)', 'ITEM-TP-01', '1.0', 1, 'Định mức tiêu chuẩn cho 1 vỏ tủ hoàn thiện'),
      ('BOM-02', 'BOM-BTP-KHUNG-V1', 'BOM Khung Thân Tủ 400x600 (V1.0)', 'ITEM-BTP-01', '1.0', 1, 'Định mức cắt chấn thép tấm'),
      ('BOM-03', 'BOM-BTP-CANH-V1', 'BOM Cánh Tủ 400x600 (V1.0)', 'ITEM-BTP-02', '1.0', 1, 'Định mức dập chấn đột lỗ cánh');
    `);

    await pool.query(`
      INSERT INTO bom_items (id, bom_id, item_id, qty, scrap_rate, note) VALUES
      ('BI-01', 'BOM-01', 'ITEM-BTP-01', 1, 0, 'Khung thân tủ'),
      ('BI-02', 'BOM-01', 'ITEM-BTP-02', 1, 0, 'Cánh tủ'),
      ('BI-03', 'BOM-01', 'ITEM-NVL-02', 1.2, 5, 'Sơn tĩnh điện (bao gồm hao hụt)'),
      ('BI-04', 'BOM-01', 'ITEM-NVL-03', 16, 2, 'Bulong ốc vít'),
      ('BI-05', 'BOM-01', 'ITEM-NVL-04', 2, 0, 'Khóa gạt MS818'),
      ('BI-06', 'BOM-02', 'ITEM-NVL-01', 5.2, 3, 'Thép tấm 1.5mm tính cả hao hụt mạt cắt'),
      ('BI-07', 'BOM-03', 'ITEM-NVL-01', 2.1, 2, 'Thép tấm 1.5mm');
    `);

    // Seed Production Orders
    await pool.query(`
      INSERT INTO production_orders (id, code, date, target_item_id, bom_id, planned_qty, actual_qty, defective_qty, lot_number, warehouse_id, status, notes) VALUES
      ('LSX-202610-001', 'LSX-202610-001', '2026-10-10', 'ITEM-TP-01', 'BOM-01', 20, 12, 1, 'LOT-TP-202610-01', 'WH-TP', 'IN_PROGRESS', 'Sản xuất giao đơn hàng khách ME Tân Bình'),
      ('LSX-202610-002', 'LSX-202610-002', '2026-10-05', 'ITEM-BTP-01', 'BOM-02', 30, 30, 0, 'LOT-BTP-202610-01', 'WH-BTP', 'COMPLETED', 'Gia công sẵn BTP khung thân tủ');
    `);

    await pool.query(`
      INSERT INTO production_stages (id, production_order_id, name, stage_order, status, completed_qty) VALUES
      ('STG-01', 'LSX-202610-001', 'Cắt & Chấn khung/cánh', 1, 'COMPLETED', 20),
      ('STG-02', 'LSX-202610-001', 'Sơn tĩnh điện sấy nhiệt', 2, 'COMPLETED', 18),
      ('STG-03', 'LSX-202610-001', 'Lắp ráp phụ kiện & Đóng gói', 3, 'IN_PROGRESS', 12),
      ('STG-04', 'LSX-202610-002', 'Xả phôi & Cắt CNC', 1, 'COMPLETED', 30),
      ('STG-05', 'LSX-202610-002', 'Chấn gập cạnh khung', 2, 'COMPLETED', 30),
      ('STG-06', 'LSX-202610-002', 'Hàn đính & Mài góc', 3, 'COMPLETED', 30);
    `);

    await pool.query(`
      INSERT INTO production_allocations (id, production_order_id, item_id, planned_qty, allocated_qty, actual_used_qty, lot_number) VALUES
      ('AL-01', 'LSX-202610-001', 'ITEM-BTP-01', 20, 20, 20, 'LOT-BTP-202610-01'),
      ('AL-02', 'LSX-202610-001', 'ITEM-BTP-02', 20, 20, 20, 'LOT-BTP-202610-02'),
      ('AL-03', 'LSX-202610-001', 'ITEM-NVL-02', 25.2, 26, 25, 'LOT-SON-202610'),
      ('AL-04', 'LSX-202610-001', 'ITEM-NVL-03', 326.4, 330, 250, 'LOT-BL-202609'),
      ('AL-05', 'LSX-202610-001', 'ITEM-NVL-04', 40, 40, 24, 'LOT-KH-202609'),
      ('AL-06', 'LSX-202610-002', 'ITEM-NVL-01', 160.68, 161, 161, 'LOT-THEP-202610A');
    `);

    // Seed Stock Transactions
    await pool.query(`
      INSERT INTO stock_transactions (id, code, date, type, status, source_warehouse_id, dest_warehouse_id, partner_id, ref_code, note) VALUES
      ('ST-01', 'PNK-202610-001', '2026-10-02', 'IN_PURCHASE', 'POSTED', NULL, 'WH-NVL', 'PARTNER-01', 'PO-202610-01', 'Nhập kho thép tấm SS400 từ Hòa Phát'),
      ('ST-02', 'PXK-202610-001', '2026-10-05', 'TRANSFER', 'POSTED', 'WH-NVL', 'WH-SX', NULL, 'LSX-202610-002', 'Cấp phát thép ra line sản xuất theo LSX-202610-002'),
      ('ST-03', 'PNK-202610-002', '2026-10-07', 'IN_PRODUCTION', 'POSTED', 'WH-SX', 'WH-BTP', NULL, 'LSX-202610-002', 'Nhập kho BTP hoàn thành từ LSX-202610-002');
    `);

    await pool.query(`
      INSERT INTO stock_transaction_items (id, transaction_id, item_id, lot_number, qty, price) VALUES
      ('STI-01', 'ST-01', 'ITEM-NVL-01', 'LOT-THEP-202610A', 1000, 22000),
      ('STI-02', 'ST-02', 'ITEM-NVL-01', 'LOT-THEP-202610A', 161, 22000),
      ('STI-03', 'ST-03', 'ITEM-BTP-01', 'LOT-BTP-202610-01', 30, 145000);
    `);

    // Seed Purchase Orders & Sales Orders
    await pool.query(`
      INSERT INTO purchase_orders (id, code, date, partner_id, status, total_amount, paid_amount, notes) VALUES
      ('PO-202610-01', 'PO-202610-01', '2026-10-01', 'PARTNER-01', 'RECEIVED', 22000000, 10000000, 'Đơn đặt mua thép tấm chuẩn bị cho sản xuất tháng 10'),
      ('PO-202610-02', 'PO-202610-02', '2026-10-08', 'PARTNER-02', 'CONFIRMED', 6500000, 2000000, 'Đặt thêm bột sơn tĩnh điện màu xám sần');
    `);

    await pool.query(`
      INSERT INTO purchase_order_items (id, order_id, item_id, qty, received_qty, unit_price, amount) VALUES
      ('POI-01', 'PO-202610-01', 'ITEM-NVL-01', 1000, 1000, 22000, 22000000),
      ('POI-02', 'PO-202610-02', 'ITEM-NVL-02', 100, 0, 65000, 6500000);
    `);

    await pool.query(`
      INSERT INTO sales_orders (id, code, date, partner_id, status, total_amount, paid_amount, notes) VALUES
      ('SO-202610-01', 'SO-202610-01', '2026-10-09', 'PARTNER-03', 'CONFIRMED', 9600000, 2400000, 'Hợp đồng cấp vỏ tủ cho công trình trạm biến áp Tân Bình');
    `);

    await pool.query(`
      INSERT INTO sales_order_items (id, order_id, item_id, qty, delivered_qty, unit_price, amount) VALUES
      ('SOI-01', 'SO-202610-01', 'ITEM-TP-01', 20, 0, 480000, 9600000);
    `);

    // Seed Cash Receipts & Payments
    await pool.query(`
      INSERT INTO cash_receipts (id, code, date, partner_id, type, payment_method, amount, ref_code, note) VALUES
      ('PT-202610-01', 'PT-202610-01', '2026-10-09', 'PARTNER-03', 'SALE', 'BANK', 2400000, 'SO-202610-01', 'Thu tạm ứng 25% giá trị đơn hàng SO-202610-01');
    `);

    await pool.query(`
      INSERT INTO cash_payments (id, code, date, partner_id, type, payment_method, amount, ref_code, note) VALUES
      ('PC-202610-01', 'PC-202610-01', '2026-10-03', 'PARTNER-01', 'PURCHASE', 'BANK', 10000000, 'PO-202610-01', 'Thanh toán đợt 1 tiền mua thép tấm Hòa Phát'),
      ('PC-202610-02', 'PC-202610-02', '2026-10-06', NULL, 'OVERHEAD', 'CASH', 1500000, 'CHI-XUONG', 'Tiền điện phân xưởng gia công tuần 1 tháng 10');
    `);

    // Seed Cost Calculations
    await pool.query(`
      INSERT INTO cost_calculations (id, production_order_id, date, target_item_code, target_item_name, completed_qty, material_cost, labor_cost, overhead_cost, total_cost, unit_cost, standard_bom_cost, variance) VALUES
      ('COST-01', 'LSX-202610-002', '2026-10-07', 'BTP-KHUNG-4060', 'Khung Thân Tủ 400x600 (Đã Cắt Chấn)', 30, 3542000, 540000, 270000, 4352000, 145066.67, 146300, -1233.33);
    `);

    console.log('Seed data inserted successfully!');
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
