const express = require('express');
const router = express.Router();
const { query } = require('../db');

// --- HÀNG HÓA (ITEMS) ---
router.get('/items', async (req, res) => {
  try {
    const { type, search } = req.query;
    let sql = `
      SELECT i.*, c.name as category_name 
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ' AND i.type = ?';
      params.push(type);
    }
    if (search) {
      sql += ' AND (i.code LIKE ? OR i.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY i.created_at DESC';
    const items = await query(sql, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { code, name, type = 'NVL', category_id, unit = 'Cái', cost_price = 0, sale_price = 0, min_stock = 0 } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Mã và tên hàng hóa không được để trống' });

    const id = `ITEM-${Date.now()}`;
    await query(`
      INSERT INTO items (id, code, name, type, category_id, unit, cost_price, sale_price, min_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, code, name, type, category_id || null, unit, cost_price, sale_price, min_stock]);

    res.status(201).json({ id, code, name, type, category_id, unit, cost_price, sale_price, min_stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const { code, name, type, category_id, unit, cost_price, sale_price, min_stock } = req.body;
    await query(`
      UPDATE items 
      SET code = COALESCE(?, code),
          name = COALESCE(?, name),
          type = COALESCE(?, type),
          category_id = COALESCE(?, category_id),
          unit = COALESCE(?, unit),
          cost_price = COALESCE(?, cost_price),
          sale_price = COALESCE(?, sale_price),
          min_stock = COALESCE(?, min_stock)
      WHERE id = ?
    `, [code, name, type, category_id, unit, cost_price, sale_price, min_stock, req.params.id]);

    res.json({ message: 'Cập nhật mặt hàng thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    await query('SET FOREIGN_KEY_CHECKS = 0');
    // Xóa liên kết tồn kho
    await query('DELETE FROM stock WHERE item_id = ?', [itemId]);
    // Xóa định mức liên quan
    await query('DELETE FROM bom_items WHERE item_id = ?', [itemId]);
    await query('DELETE FROM boms WHERE target_item_id = ?', [itemId]);
    // Xóa liên kết lệnh sản xuất
    await query('DELETE FROM production_allocations WHERE item_id = ?', [itemId]);
    await query('DELETE FROM production_orders WHERE target_item_id = ?', [itemId]);
    // Xóa liên kết giao dịch và đơn hàng
    await query('DELETE FROM stock_transaction_items WHERE item_id = ?', [itemId]);
    await query('DELETE FROM purchase_order_items WHERE item_id = ?', [itemId]);
    await query('DELETE FROM sales_order_items WHERE item_id = ?', [itemId]);
    // Xóa mặt hàng
    await query('DELETE FROM items WHERE id = ?', [itemId]);
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ message: 'Xóa mặt hàng và dữ liệu liên quan thành công' });
  } catch (err) {
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.status(500).json({ error: err.message });
  }
});

// API Tiện ích: Reset / Làm sạch dữ liệu hoặc nạp dữ liệu mẫu Xưởng Gỗ
router.post('/reset-data', async (req, res) => {
  try {
    const { mode = 'clean_all' } = req.body;
    await query('SET FOREIGN_KEY_CHECKS = 0');

    if (mode === 'clear_transactions') {
      await query('TRUNCATE TABLE cost_calculations');
      await query('TRUNCATE TABLE cash_payments');
      await query('TRUNCATE TABLE cash_receipts');
      await query('TRUNCATE TABLE sales_order_items');
      await query('TRUNCATE TABLE sales_orders');
      await query('TRUNCATE TABLE purchase_order_items');
      await query('TRUNCATE TABLE purchase_orders');
      await query('TRUNCATE TABLE stock_transaction_items');
      await query('TRUNCATE TABLE stock_transactions');
      await query('TRUNCATE TABLE production_allocations');
      await query('TRUNCATE TABLE production_stages');
      await query('TRUNCATE TABLE production_orders');
      await query('TRUNCATE TABLE stock');
      await query('SET FOREIGN_KEY_CHECKS = 1');
      return res.json({ message: 'Đã xóa trắng toàn bộ dữ liệu giao dịch (Kho, Đơn hàng, Lệnh SX, Sổ quỹ) thành công!' });
    }

    if (mode === 'clean_all') {
      await query('TRUNCATE TABLE cost_calculations');
      await query('TRUNCATE TABLE cash_payments');
      await query('TRUNCATE TABLE cash_receipts');
      await query('TRUNCATE TABLE sales_order_items');
      await query('TRUNCATE TABLE sales_orders');
      await query('TRUNCATE TABLE purchase_order_items');
      await query('TRUNCATE TABLE purchase_orders');
      await query('TRUNCATE TABLE stock_transaction_items');
      await query('TRUNCATE TABLE stock_transactions');
      await query('TRUNCATE TABLE production_allocations');
      await query('TRUNCATE TABLE production_stages');
      await query('TRUNCATE TABLE production_orders');
      await query('TRUNCATE TABLE bom_items');
      await query('TRUNCATE TABLE boms');
      await query('TRUNCATE TABLE partners');
      await query('TRUNCATE TABLE stock');
      await query('TRUNCATE TABLE items');
      await query('SET FOREIGN_KEY_CHECKS = 1');
      return res.json({ message: 'Đã làm sạch toàn bộ cơ sở dữ liệu. Bạn có thể tự do nhập liệu mới!' });
    }

    if (mode === 'seed_wood') {
      await query('TRUNCATE TABLE cost_calculations');
      await query('TRUNCATE TABLE cash_payments');
      await query('TRUNCATE TABLE cash_receipts');
      await query('TRUNCATE TABLE sales_order_items');
      await query('TRUNCATE TABLE sales_orders');
      await query('TRUNCATE TABLE purchase_order_items');
      await query('TRUNCATE TABLE purchase_orders');
      await query('TRUNCATE TABLE stock_transaction_items');
      await query('TRUNCATE TABLE stock_transactions');
      await query('TRUNCATE TABLE production_allocations');
      await query('TRUNCATE TABLE production_stages');
      await query('TRUNCATE TABLE production_orders');
      await query('TRUNCATE TABLE bom_items');
      await query('TRUNCATE TABLE boms');
      await query('TRUNCATE TABLE partners');
      await query('TRUNCATE TABLE stock');
      await query('TRUNCATE TABLE items');
      await query('TRUNCATE TABLE warehouses');
      await query('TRUNCATE TABLE categories');

      // Seed Categories
      await query(`
        INSERT INTO categories (id, name, type) VALUES
        ('CAT-01', 'Gỗ Tự Nhiên & Ván Công Nghiệp', 'NVL'),
        ('CAT-02', 'Phụ Kiện Ngũ Kim Mộc & Ray Bản Lề', 'NVL'),
        ('CAT-03', 'Sơn PU, Keo Dán & Vật Tư Hoàn Thiện', 'NVL'),
        ('CAT-04', 'Bán Thành Phẩm Mộc Thô (BTP)', 'BTP'),
        ('CAT-05', 'Đồ Gỗ Nội Thất Hoàn Thiện (TP)', 'TP');
      `);

      // Seed Warehouses
      await query(`
        INSERT INTO warehouses (id, code, name, type, location) VALUES
        ('WH-NVL', 'KHO-GO', 'Kho Gỗ Khối & Ván MDF', 'NVL', 'Khu A - Gỗ Sồi, Gỗ Tự Nhiên & Ván MDF An Cường'),
        ('WH-PK', 'KHO-NGUKIM', 'Kho Phụ Kiện Ngũ Kim & Sơn PU', 'NVL', 'Khu B - Bản lề Hafele, Ray trượt, Keo Titebond & Sơn PU'),
        ('WH-BTP', 'KHO-BTP', 'Kho Bán Thành Phẩm Mộc Thô', 'BTP', 'Khu C - Khung chân, mặt bàn phôi mộc sau CNC'),
        ('WH-TP', 'KHO-TP', 'Kho Thành Phẩm Nội Thất', 'TP', 'Khu D - Hàng bọc màng PE chống xước sẵn sàng giao'),
        ('WH-SX', 'KHO-SX', 'Khu Line Sản Xuất & Buồng Sơn PU', 'SX', 'Khu máy xẻ nan, dán cạnh tự động & phòng phun sơn');
      `);

      // Seed Items
      await query(`
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
      await query(`
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
        ('STK-10', 'WH-TP', 'ITEM-TP-02', 'LOT-TP-TUAO-202610', 2);
      `);

      // Seed Partners
      await query(`
        INSERT INTO partners (id, code, name, type, phone, address, debt) VALUES
        ('PARTNER-01', 'NCC-ANCUONG', 'Công Ty Cổ Phần Gỗ An Cường', 'SUPPLIER', '0283.862.5727', '279 Nguyễn Tri Phương, P.5, Q.10, TP.HCM', 18500000),
        ('PARTNER-02', 'NCC-GOMY', 'Tổng Kho Gỗ Nhập Khẩu Bắc Mỹ KingWood', 'SUPPLIER', '0913.567.890', 'Cảng Đình Vũ, Hải Phòng', 45000000),
        ('PARTNER-03', 'NCC-HAFELE', 'Công Ty TNHH Hafele Việt Nam', 'SUPPLIER', '0283.911.5678', '9 Nguyễn Minh Hoàng, P.12, Q. Tân Bình, TP.HCM', 5600000),
        ('PARTNER-04', 'KH-VINHOMES', 'BQL Dự Án Căn Hộ Vinhomes Ocean Park (A+ Decor)', 'CUSTOMER', '0903.888.777', 'Khu Đô Thị Vinhomes Ocean Park, Gia Lâm, Hà Nội', 35000000),
        ('PARTNER-05', 'KH-ECOPARK', 'Biệt Thự Vườn Ecopark Grand The Island', 'CUSTOMER', '0988.123.456', 'Khu Đô Thị Ecopark, Văn Giang, Hưng Yên', 0);
      `);

      // Seed BOMs
      await query(`
        INSERT INTO boms (id, code, name, target_item_id, version, standard_qty, notes) VALUES
        ('BOM-01', 'BOM-BANAN-SOI-V1', 'BOM Bàn Ăn Gỗ Sồi 6 Ghế Tự Nhiên (V1.0)', 'ITEM-TP-01', '1.0', 1, 'Định mức tiêu chuẩn cho 1 bộ bàn ăn gỗ sồi hoàn thiện sơn PU'),
        ('BOM-02', 'BOM-MATBAN-SOI-V1', 'BOM Mặt Bàn Gỗ Sồi Ghép Mộng 1m8 (V1.0)', 'ITEM-BTP-01', '1.0', 1, 'Định mức xẻ phôi, ghép mộng & bào phẳng mặt bàn'),
        ('BOM-03', 'BOM-TUAO-MDF-V1', 'BOM Tủ Quần Áo 4 Cánh MDF An Cường (V1.0)', 'ITEM-TP-02', '1.0', 1, 'Định mức ván MDF, bản lề giảm chấn & ray trượt bi');
      `);

      await query(`
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

      await query('SET FOREIGN_KEY_CHECKS = 1');
      return res.json({ message: 'Đã nạp lại thành công 100% dữ liệu mẫu chuẩn Xưởng Gỗ Nội Thất!' });
    }

    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ message: 'Hoàn tất' });
  } catch (err) {
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.status(500).json({ error: err.message });
  }
});


// --- KHO (WAREHOUSES) ---
router.get('/warehouses', async (req, res) => {
  try {
    const warehouses = await query('SELECT * FROM warehouses ORDER BY code ASC');
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/warehouses', async (req, res) => {
  try {
    const { code, name, type = 'NVL', location = '' } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Mã và tên kho không được để trống' });
    const id = `WH-${Date.now()}`;
    await query(`
      INSERT INTO warehouses (id, code, name, type, location)
      VALUES (?, ?, ?, ?, ?)
    `, [id, code, name, type, location]);
    res.status(201).json({ id, code, name, type, location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/warehouses/:id', async (req, res) => {
  try {
    const { code, name, type, location } = req.body;
    await query(`
      UPDATE warehouses 
      SET code = COALESCE(?, code),
          name = COALESCE(?, name),
          type = COALESCE(?, type),
          location = COALESCE(?, location)
      WHERE id = ?
    `, [code, name, type, location, req.params.id]);
    res.json({ message: 'Cập nhật thông tin kho thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/warehouses/:id', async (req, res) => {
  try {
    await query('SET FOREIGN_KEY_CHECKS = 0');
    await query('DELETE FROM stock WHERE warehouse_id = ?', [req.params.id]);
    await query('DELETE FROM stock_transactions WHERE source_warehouse_id = ? OR dest_warehouse_id = ?', [req.params.id, req.params.id]);
    await query('DELETE FROM production_orders WHERE warehouse_id = ?', [req.params.id]);
    await query('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ message: 'Xóa kho và dữ liệu liên quan thành công' });
  } catch (err) {
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.status(500).json({ error: err.message });
  }
});

// --- ĐỐI TÁC (PARTNERS) ---
router.get('/partners', async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM partners WHERE 1=1';
    const params = [];
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY name ASC';
    const partners = await query(sql, params);
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/partners', async (req, res) => {
  try {
    const { code, name, type = 'CUSTOMER', phone = '', address = '', debt = 0 } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Mã và tên đối tác không được trống' });
    const id = `PARTNER-${Date.now()}`;
    await query(`
      INSERT INTO partners (id, code, name, type, phone, address, debt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, code, name, type, phone, address, debt]);
    res.status(201).json({ id, code, name, type, phone, address, debt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/partners/:id', async (req, res) => {
  try {
    const { code, name, type, phone, address, debt } = req.body;
    await query(`
      UPDATE partners 
      SET code = COALESCE(?, code),
          name = COALESCE(?, name),
          type = COALESCE(?, type),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          debt = COALESCE(?, debt)
      WHERE id = ?
    `, [code, name, type, phone, address, debt, req.params.id]);
    res.json({ message: 'Cập nhật đối tác thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/partners/:id', async (req, res) => {
  try {
    await query('SET FOREIGN_KEY_CHECKS = 0');
    await query('DELETE FROM purchase_orders WHERE partner_id = ?', [req.params.id]);
    await query('DELETE FROM sales_orders WHERE partner_id = ?', [req.params.id]);
    await query('DELETE FROM cash_payments WHERE partner_id = ?', [req.params.id]);
    await query('DELETE FROM cash_receipts WHERE partner_id = ?', [req.params.id]);
    await query('DELETE FROM partners WHERE id = ?', [req.params.id]);
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ message: 'Xóa đối tác thành công' });
  } catch (err) {
    await query('SET FOREIGN_KEY_CHECKS = 1');
    res.status(500).json({ error: err.message });
  }
});


// --- NHÓM HÀNG (CATEGORIES) ---
router.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
