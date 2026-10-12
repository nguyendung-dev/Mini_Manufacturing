const express = require('express');
const router = express.Router();
const { query, getConnection } = require('../db');

// Lấy danh sách tồn kho chi tiết theo kho, mặt hàng và số lô
router.get('/stock', async (req, res) => {
  try {
    const { warehouseId, itemId, search, type } = req.query;
    let sql = `
      SELECT s.*, 
             i.code as item_code, i.name as item_name, i.unit as item_unit, i.type as item_type, i.cost_price,
             w.code as warehouse_code, w.name as warehouse_name, w.type as warehouse_type,
             (s.quantity * i.cost_price) as total_value
      FROM stock s
      JOIN items i ON s.item_id = i.id
      JOIN warehouses w ON s.warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (warehouseId) {
      sql += ' AND s.warehouse_id = ?';
      params.push(warehouseId);
    }
    if (itemId) {
      sql += ' AND s.item_id = ?';
      params.push(itemId);
    }
    if (type) {
      sql += ' AND i.type = ?';
      params.push(type);
    }
    if (search) {
      sql += ' AND (i.code LIKE ? OR i.name LIKE ? OR s.lot_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY w.code ASC, i.code ASC';
    const list = await query(sql, params);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách chứng từ kho
router.get('/transactions', async (req, res) => {
  try {
    const { type, status } = req.query;
    let sql = `
      SELECT t.*, 
             sw.name as source_warehouse_name,
             dw.name as dest_warehouse_name,
             p.name as partner_name
      FROM stock_transactions t
      LEFT JOIN warehouses sw ON t.source_warehouse_id = sw.id
      LEFT JOIN warehouses dw ON t.dest_warehouse_id = dw.id
      LEFT JOIN partners p ON t.partner_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ' AND t.type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY t.date DESC, t.created_at DESC';
    const transactions = await query(sql, params);

    // Lấy chi tiết items cho từng transaction
    const txIds = transactions.map(t => t.id);
    if (txIds.length > 0) {
      const placeholders = txIds.map(() => '?').join(',');
      const items = await query(`
        SELECT ti.*, i.code as item_code, i.name as item_name, i.unit as item_unit
        FROM stock_transaction_items ti
        JOIN items i ON ti.item_id = i.id
        WHERE ti.transaction_id IN (${placeholders})
      `, txIds);

      const itemsMap = {};
      items.forEach(it => {
        if (!itemsMap[it.transaction_id]) itemsMap[it.transaction_id] = [];
        itemsMap[it.transaction_id].push(it);
      });

      transactions.forEach(t => {
        t.items = itemsMap[t.id] || [];
      });
    }

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tạo phiếu kho mới (DRAFT hoặc POSTED)
router.post('/transactions', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      code,
      date = new Date().toISOString().split('T')[0],
      type, // IN_PURCHASE | IN_PRODUCTION | OUT_PRODUCTION | OUT_SALE | TRANSFER | ADJUST
      status = 'DRAFT', // DRAFT | POSTED
      source_warehouse_id,
      dest_warehouse_id,
      partner_id,
      ref_code,
      note,
      items = []
    } = req.body;

    if (!type) {
      await conn.rollback();
      return res.status(400).json({ error: 'Loại phiếu kho không được để trống' });
    }
    if (!items || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Phiếu kho phải có ít nhất một mặt hàng' });
    }

    // Nếu ghi sổ ngay (POSTED), kiểm tra tồn kho không cho xuất âm (Quy tắc 4)
    if (status === 'POSTED') {
      const err = await checkStockAvailability(conn, type, source_warehouse_id, items);
      if (err) {
        await conn.rollback();
        return res.status(400).json({ error: err });
      }
    }

    const txId = `ST-${Date.now()}`;
    const generatedCode = code || `${type.startsWith('IN') ? 'PNK' : type.startsWith('OUT') ? 'PXK' : 'PCK'}-${Date.now().toString().slice(-6)}`;

    await conn.query(`
      INSERT INTO stock_transactions (id, code, date, type, status, source_warehouse_id, dest_warehouse_id, partner_id, ref_code, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [txId, generatedCode, date, type, status, source_warehouse_id || null, dest_warehouse_id || null, partner_id || null, ref_code || null, note || null]);

    for (const line of items) {
      const lineId = `STI-${Date.now()}-${Math.random().toString().slice(-4)}`;
      const lot = line.lot_number || line.lotNumber || 'LOT-AUTO';
      const qty = Number(line.qty || 0);
      const price = Number(line.price || 0);

      await conn.query(`
        INSERT INTO stock_transaction_items (id, transaction_id, item_id, lot_number, qty, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [lineId, txId, line.item_id || line.itemId, lot, qty, price]);

      // Nếu ghi sổ ngay, cập nhật tồn kho
      if (status === 'POSTED') {
        await applyStockChange(conn, type, source_warehouse_id, dest_warehouse_id, line.item_id || line.itemId, lot, qty);
      }
    }

    await conn.commit();
    res.status(201).json({ id: txId, code: generatedCode, message: 'Tạo phiếu kho thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Ghi sổ phiếu kho (DRAFT -> POSTED)
router.post('/transactions/:id/post', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [txRows] = await conn.query('SELECT * FROM stock_transactions WHERE id = ?', [req.params.id]);
    if (txRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy chứng từ' });
    }
    const tx = txRows[0];
    if (tx.status === 'POSTED') {
      await conn.rollback();
      return res.status(400).json({ error: 'Chứng từ này đã ghi sổ rồi' });
    }

    const [items] = await conn.query('SELECT * FROM stock_transaction_items WHERE transaction_id = ?', [tx.id]);
    const err = await checkStockAvailability(conn, tx.type, tx.source_warehouse_id, items);
    if (err) {
      await conn.rollback();
      return res.status(400).json({ error: err });
    }

    for (const line of items) {
      await applyStockChange(conn, tx.type, tx.source_warehouse_id, tx.dest_warehouse_id, line.item_id, line.lot_number, line.qty);
    }

    await conn.query('UPDATE stock_transactions SET status = "POSTED" WHERE id = ?', [tx.id]);

    await conn.commit();
    res.json({ message: 'Ghi sổ phiếu kho thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Hàm kiểm tra tồn kho khả dụng
async function checkStockAvailability(conn, type, sourceWarehouseId, items) {
  if (['OUT_PRODUCTION', 'OUT_SALE', 'TRANSFER'].includes(type)) {
    if (!sourceWarehouseId) return 'Vui lòng chọn kho xuất';

    for (const line of items) {
      const itemId = line.item_id || line.itemId;
      const lot = line.lot_number || line.lotNumber;
      const qty = Number(line.qty || 0);

      const [rows] = await conn.query(`
        SELECT s.quantity, i.name as item_name
        FROM stock s
        JOIN items i ON s.item_id = i.id
        WHERE s.warehouse_id = ? AND s.item_id = ? AND s.lot_number = ?
      `, [sourceWarehouseId, itemId, lot]);

      const available = rows.length > 0 ? Number(rows[0].quantity) : 0;
      if (available < qty) {
        const itemName = rows.length > 0 ? rows[0].item_name : itemId;
        return `Mặt hàng [${itemName}] tại lô [${lot}] không đủ tồn kho để xuất (Hiện có: ${available}, Cần xuất: ${qty})`;
      }
    }
  }
  return null;
}

// Hàm cập nhật tồn kho (tăng/giảm số lượng trong bảng stock)
async function applyStockChange(conn, type, sourceWarehouseId, destWarehouseId, itemId, lotNumber, qty) {
  // Giảm kho nguồn
  if (['OUT_PRODUCTION', 'OUT_SALE', 'TRANSFER'].includes(type) && sourceWarehouseId) {
    await conn.query(`
      UPDATE stock 
      SET quantity = quantity - ? 
      WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
    `, [qty, sourceWarehouseId, itemId, lotNumber]);
  }

  // Tăng kho đích
  if (['IN_PURCHASE', 'IN_PRODUCTION', 'TRANSFER'].includes(type) && destWarehouseId) {
    const [existing] = await conn.query(`
      SELECT id FROM stock 
      WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
    `, [destWarehouseId, itemId, lotNumber]);

    if (existing.length > 0) {
      await conn.query(`
        UPDATE stock 
        SET quantity = quantity + ? 
        WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
      `, [qty, destWarehouseId, itemId, lotNumber]);
    } else {
      const stockId = `STK-${Date.now()}-${Math.random().toString().slice(-4)}`;
      await conn.query(`
        INSERT INTO stock (id, warehouse_id, item_id, lot_number, quantity)
        VALUES (?, ?, ?, ?, ?)
      `, [stockId, destWarehouseId, itemId, lotNumber, qty]);
    }
  }
}

// Truy xuất nguồn gốc số lô (Lot Traceability)
router.get('/trace/:lotNumber', async (req, res) => {
  try {
    const targetLot = req.params.lotNumber;

    // 1. Tồn kho hiện tại của lô này
    const currentStock = await query(`
      SELECT s.*, w.name as warehouse_name, i.code as item_code, i.name as item_name, i.unit
      FROM stock s
      JOIN warehouses w ON s.warehouse_id = w.id
      JOIN items i ON s.item_id = i.id
      WHERE s.lot_number = ?
    `, [targetLot]);

    // 2. Lô này được sản xuất từ Lệnh sản xuất nào
    const producedInOrders = await query(`
      SELECT po.*, i.name as item_name
      FROM production_orders po
      JOIN items i ON po.target_item_id = i.id
      WHERE po.lot_number = ?
    `, [targetLot]);

    // 3. Lô này được cấp phát tiêu thụ cho Lệnh sản xuất nào
    const consumedInOrders = await query(`
      SELECT pa.*, po.code as production_order_code, po.date, i.name as item_name
      FROM production_allocations pa
      JOIN production_orders po ON pa.production_order_id = po.id
      JOIN items i ON pa.item_id = i.id
      WHERE pa.lot_number = ?
    `, [targetLot]);

    // 4. Các phiếu nhập xuất liên quan đến lô này
    const relatedTransactions = await query(`
      SELECT st.*, sti.qty, sti.price, i.name as item_name, sw.name as source_wh, dw.name as dest_wh
      FROM stock_transaction_items sti
      JOIN stock_transactions st ON sti.transaction_id = st.id
      JOIN items i ON sti.item_id = i.id
      LEFT JOIN warehouses sw ON st.source_warehouse_id = sw.id
      LEFT JOIN warehouses dw ON st.dest_warehouse_id = dw.id
      WHERE sti.lot_number = ?
      ORDER BY st.date DESC
    `, [targetLot]);

    res.json({
      lotNumber: targetLot,
      currentStock,
      producedInOrders,
      consumedInOrders,
      relatedTransactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
