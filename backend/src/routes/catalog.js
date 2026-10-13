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
    const [stk] = await query('SELECT COUNT(*) as count FROM stock WHERE item_id = ? AND quantity > 0', [req.params.id]);
    if (stk && stk.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa mặt hàng đang có số lượng tồn kho > 0' });
    }
    const [bom] = await query('SELECT COUNT(*) as count FROM bom_items WHERE item_id = ?', [req.params.id]);
    if (bom && bom.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa mặt hàng đang được sử dụng trong Định mức BOM' });
    }
    await query('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Xóa mặt hàng thành công' });
  } catch (err) {
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
    const [stk] = await query('SELECT COUNT(*) as count FROM stock WHERE warehouse_id = ? AND quantity > 0', [req.params.id]);
    if (stk && stk.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa kho đang còn chứa hàng hóa tồn kho' });
    }
    await query('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Xóa kho thành công' });
  } catch (err) {
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
    const [po] = await query('SELECT COUNT(*) as count FROM purchase_orders WHERE partner_id = ?', [req.params.id]);
    const [so] = await query('SELECT COUNT(*) as count FROM sales_orders WHERE partner_id = ?', [req.params.id]);
    if ((po && po.count > 0) || (so && so.count > 0)) {
      return res.status(400).json({ error: 'Không thể xóa đối tác đã phát sinh Đơn mua hàng (PO) hoặc Đơn bán hàng (SO)' });
    }
    await query('DELETE FROM partners WHERE id = ?', [req.params.id]);
    res.json({ message: 'Xóa đối tác thành công' });
  } catch (err) {
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
