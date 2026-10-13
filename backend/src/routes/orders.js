const express = require('express');
const router = express.Router();
const { query, getConnection } = require('../db');

// --- ĐƠN MUA HÀNG (PO) ---
router.get('/purchase', async (req, res) => {
  try {
    const orders = await query(`
      SELECT po.*, p.name as partner_name, p.phone as partner_phone
      FROM purchase_orders po
      JOIN partners p ON po.partner_id = p.id
      ORDER BY po.date DESC, po.created_at DESC
    `);

    const orderIds = orders.map(o => o.id);
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const items = await query(`
        SELECT poi.*, i.code as item_code, i.name as item_name, i.unit as item_unit
        FROM purchase_order_items poi
        JOIN items i ON poi.item_id = i.id
        WHERE poi.order_id IN (${placeholders})
      `, orderIds);

      const itemsMap = {};
      items.forEach(it => {
        if (!itemsMap[it.order_id]) itemsMap[it.order_id] = [];
        itemsMap[it.order_id].push(it);
      });

      orders.forEach(o => {
        o.items = itemsMap[o.id] || [];
      });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { code, date = new Date().toISOString().split('T')[0], partner_id, notes = '', items = [] } = req.body;
    if (!partner_id || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Vui lòng chọn Nhà cung cấp và nhập mặt hàng' });
    }

    const orderId = `PO-${Date.now()}`;
    const generatedCode = code || `PO-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    for (const line of items) {
      const lineAmt = Number(line.qty || 0) * Number(line.unit_price || 0);
      totalAmount += lineAmt;
    }

    await conn.query(`
      INSERT INTO purchase_orders (id, code, date, partner_id, status, total_amount, paid_amount, notes)
      VALUES (?, ?, ?, ?, 'CONFIRMED', ?, 0, ?)
    `, [orderId, generatedCode, date, partner_id, totalAmount, notes]);

    for (const line of items) {
      const lineId = `POI-${Date.now()}-${Math.random().toString().slice(-4)}`;
      const lineAmt = Number(line.qty || 0) * Number(line.unit_price || 0);
      await conn.query(`
        INSERT INTO purchase_order_items (id, order_id, item_id, qty, received_qty, unit_price, amount)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `, [lineId, orderId, line.item_id, line.qty, line.unit_price, lineAmt]);
    }

    // Tăng công nợ phải trả cho nhà cung cấp
    await conn.query('UPDATE partners SET debt = debt + ? WHERE id = ?', [totalAmount, partner_id]);

    await conn.commit();
    res.status(201).json({ id: orderId, code: generatedCode, totalAmount, message: 'Tạo đơn mua hàng thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Nhận hàng theo đơn mua (tự động tạo phiếu nhập kho KHO-NVL)
router.post('/purchase/:id/receive', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const orderId = req.params.id;
    const { destWarehouseId = 'WH-NVL', lotNumber = `LOT-PO-${Date.now().toString().slice(-4)}` } = req.body;

    const [orders] = await conn.query('SELECT * FROM purchase_orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn mua' });
    }
    const order = orders[0];

    const [items] = await conn.query('SELECT * FROM purchase_order_items WHERE order_id = ?', [orderId]);

    // Tạo phiếu nhập kho
    const txId = `ST-${Date.now()}`;
    const txCode = `PNK-PO-${Date.now().toString().slice(-6)}`;

    await conn.query(`
      INSERT INTO stock_transactions (id, code, date, type, status, source_warehouse_id, dest_warehouse_id, partner_id, ref_code, note)
      VALUES (?, ?, CURDATE(), 'IN_PURCHASE', 'POSTED', NULL, ?, ?, ?, ?)
    `, [txId, txCode, destWarehouseId, order.partner_id, order.code, `Nhập kho theo đơn mua ${order.code}`]);

    for (const it of items) {
      const qtyToReceive = Number(it.qty) - Number(it.received_qty);
      if (qtyToReceive <= 0) continue;

      // Lưu item transaction
      await conn.query(`
        INSERT INTO stock_transaction_items (id, transaction_id, item_id, lot_number, qty, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [`STI-${Date.now()}-${Math.random().toString().slice(-4)}`, txId, it.item_id, lotNumber, qtyToReceive, it.unit_price]);

      // Tăng tồn kho
      const [exist] = await conn.query(`
        SELECT id FROM stock 
        WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
      `, [destWarehouseId, it.item_id, lotNumber]);

      if (exist.length > 0) {
        await conn.query(`
          UPDATE stock 
          SET quantity = quantity + ? 
          WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
        `, [qtyToReceive, destWarehouseId, it.item_id, lotNumber]);
      } else {
        await conn.query(`
          INSERT INTO stock (id, warehouse_id, item_id, lot_number, quantity)
          VALUES (?, ?, ?, ?, ?)
        `, [`STK-${Date.now()}-${Math.random().toString().slice(-4)}`, destWarehouseId, it.item_id, lotNumber, qtyToReceive]);
      }

      // Cập nhật số lượng đã nhận trong PO
      await conn.query(`
        UPDATE purchase_order_items 
        SET received_qty = received_qty + ? 
        WHERE id = ?
      `, [qtyToReceive, it.id]);
    }

    // Đổi trạng thái PO sang RECEIVED
    await conn.query('UPDATE purchase_orders SET status = "RECEIVED" WHERE id = ?', [orderId]);

    await conn.commit();
    res.json({ message: 'Nhận hàng và nhập kho thành công', txCode });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// --- ĐƠN BÁN HÀNG (SO) ---
router.get('/sales', async (req, res) => {
  try {
    const orders = await query(`
      SELECT so.*, p.name as partner_name, p.phone as partner_phone
      FROM sales_orders so
      LEFT JOIN partners p ON so.partner_id = p.id
      ORDER BY so.date DESC, so.created_at DESC
    `);

    const orderIds = orders.map(o => o.id);
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const items = await query(`
        SELECT soi.*, i.code as item_code, i.name as item_name, i.unit as item_unit
        FROM sales_order_items soi
        JOIN items i ON soi.item_id = i.id
        WHERE soi.order_id IN (${placeholders})
      `, orderIds);

      const itemsMap = {};
      items.forEach(it => {
        if (!itemsMap[it.order_id]) itemsMap[it.order_id] = [];
        itemsMap[it.order_id].push(it);
      });

      orders.forEach(o => {
        o.items = itemsMap[o.id] || [];
      });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { code, date = new Date().toISOString().split('T')[0], partner_id, notes = '', items = [] } = req.body;
    if (!partner_id || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Vui lòng chọn Khách hàng và nhập sản phẩm bán' });
    }

    const orderId = `SO-${Date.now()}`;
    const generatedCode = code || `SO-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    for (const line of items) {
      const lineAmt = Number(line.qty || 0) * Number(line.unit_price || 0);
      totalAmount += lineAmt;
    }

    await conn.query(`
      INSERT INTO sales_orders (id, code, date, partner_id, status, total_amount, paid_amount, notes)
      VALUES (?, ?, ?, ?, 'CONFIRMED', ?, 0, ?)
    `, [orderId, generatedCode, date, partner_id, totalAmount, notes]);

    for (const line of items) {
      const lineId = `SOI-${Date.now()}-${Math.random().toString().slice(-4)}`;
      const lineAmt = Number(line.qty || 0) * Number(line.unit_price || 0);
      await conn.query(`
        INSERT INTO sales_order_items (id, order_id, item_id, qty, delivered_qty, unit_price, amount)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `, [lineId, orderId, line.item_id, line.qty, line.unit_price, lineAmt]);
    }

    // Tăng công nợ phải thu của khách hàng
    await conn.query('UPDATE partners SET debt = debt + ? WHERE id = ?', [totalAmount, partner_id]);

    await conn.commit();
    res.status(201).json({ id: orderId, code: generatedCode, totalAmount, message: 'Tạo đơn bán hàng thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Giao hàng / Xuất bán theo đơn bán (Tự động trừ tồn kho TP và đổi trạng thái SO)
router.post('/sales/:id/deliver', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const orderId = req.params.id;
    const { sourceWarehouseId = 'WH-TP', items = [] } = req.body;

    const [orders] = await conn.query('SELECT * FROM sales_orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn bán' });
    }
    const order = orders[0];

    // Tự động phân giải ID kho Thành Phẩm
    let finalSourceWh = sourceWarehouseId;
    const [tpWhRows] = await conn.query('SELECT id FROM warehouses WHERE id = ? OR code = ? OR type = "TP" LIMIT 1', [sourceWarehouseId, sourceWarehouseId]);
    if (tpWhRows.length > 0) finalSourceWh = tpWhRows[0].id;

    const txId = `ST-${Date.now()}`;
    const txCode = `PXK-BAN-${Date.now().toString().slice(-6)}`;

    await conn.query(`
      INSERT INTO stock_transactions (id, code, date, type, status, source_warehouse_id, dest_warehouse_id, partner_id, ref_code, note)
      VALUES (?, ?, CURDATE(), 'OUT_SALE', 'POSTED', ?, NULL, ?, ?, ?)
    `, [txId, txCode, finalSourceWh, order.partner_id, order.code, `Xuất giao hàng theo đơn bán ${order.code}`]);

    for (const it of items) {
      const qty = Number(it.qty || 0);
      let lot = it.lotNumber;

      // 1. Kiểm tra xem lô chỉ định có tồn không
      let [stkRows] = await conn.query(`
        SELECT lot_number, quantity FROM stock 
        WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
      `, [finalSourceWh, it.itemId, lot]);

      // 2. Nếu lô chỉ định không có hoặc không đủ, tự động tìm lô có sẵn tồn kho của sản phẩm này trong kho TP
      if (stkRows.length === 0 || Number(stkRows[0].quantity) < qty) {
        const [anyLot] = await conn.query(`
          SELECT lot_number, quantity FROM stock 
          WHERE warehouse_id = ? AND item_id = ? AND quantity >= ?
          ORDER BY quantity DESC LIMIT 1
        `, [finalSourceWh, it.itemId, qty]);

        if (anyLot.length > 0) {
          lot = anyLot[0].lot_number;
          stkRows = anyLot;
        }
      }

      const curQty = stkRows.length > 0 ? Number(stkRows[0].quantity) : 0;
      if (curQty < qty) {
        await conn.rollback();
        return res.status(400).json({ error: `Tồn kho không đủ để xuất (Hiện có: ${curQty}, cần xuất: ${qty}). Vui lòng hoàn thành Lệnh sản xuất để nhập bàn vào kho trước!` });
      }

      // Giảm kho
      await conn.query(`
        UPDATE stock 
        SET quantity = quantity - ? 
        WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
      `, [qty, finalSourceWh, it.itemId, lot]);

      // Lưu transaction line
      await conn.query(`
        INSERT INTO stock_transaction_items (id, transaction_id, item_id, lot_number, qty, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [`STI-${Date.now()}-${Math.random().toString().slice(-4)}`, txId, it.itemId, lot, qty, it.unitPrice || 0]);

      // Cập nhật delivered_qty
      await conn.query(`
        UPDATE sales_order_items 
        SET delivered_qty = delivered_qty + ? 
        WHERE order_id = ? AND item_id = ?
      `, [qty, orderId, it.itemId]);
    }

    await conn.query('UPDATE sales_orders SET status = "DELIVERED" WHERE id = ?', [orderId]);

    await conn.commit();
    res.json({ message: 'Xuất giao hàng thành công', txCode });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Xóa Đơn mua hàng (PO)
router.delete('/purchase/:id', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT status FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn mua hàng' });
    }
    if (rows[0].status === 'RECEIVED') {
      await conn.rollback();
      return res.status(400).json({ error: 'Không thể xóa đơn mua hàng đã nhập kho' });
    }

    await conn.query('DELETE FROM purchase_order_items WHERE order_id = ?', [req.params.id]);
    await conn.query('DELETE FROM purchase_orders WHERE id = ?', [req.params.id]);

    await conn.commit();
    res.json({ message: 'Xóa đơn mua hàng thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Xóa Đơn bán hàng (SO)
router.delete('/sales/:id', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT status FROM sales_orders WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đơn bán hàng' });
    }
    if (rows[0].status === 'DELIVERED') {
      await conn.rollback();
      return res.status(400).json({ error: 'Không thể xóa đơn bán hàng đã xuất kho giao khách' });
    }

    await conn.query('DELETE FROM sales_order_items WHERE order_id = ?', [req.params.id]);
    await conn.query('DELETE FROM sales_orders WHERE id = ?', [req.params.id]);

    await conn.commit();
    res.json({ message: 'Xóa đơn bán hàng thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
