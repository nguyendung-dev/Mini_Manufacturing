const express = require('express');
const router = express.Router();
const { query, getConnection } = require('../db');

// Lấy danh sách toàn bộ BOM kèm linh kiện
router.get('/', async (req, res) => {
  try {
    const boms = await query(`
      SELECT b.*, i.code as target_item_code, i.name as target_item_name, i.unit as target_item_unit
      FROM boms b
      JOIN items i ON b.target_item_id = i.id
      ORDER BY b.created_at DESC
    `);

    const bomIds = boms.map(b => b.id);
    if (bomIds.length > 0) {
      const placeholders = bomIds.map(() => '?').join(',');
      const items = await query(`
        SELECT bi.*, i.code as item_code, i.name as item_name, i.unit as item_unit, i.cost_price
        FROM bom_items bi
        JOIN items i ON bi.item_id = i.id
        WHERE bi.bom_id IN (${placeholders})
      `, bomIds);

      const itemsMap = {};
      items.forEach(it => {
        if (!itemsMap[it.bom_id]) itemsMap[it.bom_id] = [];
        itemsMap[it.bom_id].push(it);
      });

      boms.forEach(b => {
        b.components = itemsMap[b.id] || [];
        // Tính tổng chi phí định mức kế hoạch
        b.estimatedCost = (b.components || []).reduce((acc, c) => {
          const qtyWithScrap = Number(c.qty) * (1 + Number(c.scrap_rate || 0) / 100);
          return acc + qtyWithScrap * Number(c.cost_price || 0);
        }, 0);
      });
    }

    res.json(boms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy chi tiết 1 BOM
router.get('/:id', async (req, res) => {
  try {
    const boms = await query(`
      SELECT b.*, i.code as target_item_code, i.name as target_item_name, i.unit as target_item_unit
      FROM boms b
      JOIN items i ON b.target_item_id = i.id
      WHERE b.id = ?
    `, [req.params.id]);

    if (boms.length === 0) return res.status(404).json({ error: 'Không tìm thấy BOM' });
    const bom = boms[0];

    bom.components = await query(`
      SELECT bi.*, i.code as item_code, i.name as item_name, i.unit as item_unit, i.cost_price
      FROM bom_items bi
      JOIN items i ON bi.item_id = i.id
      WHERE bi.bom_id = ?
    `, [bom.id]);

    res.json(bom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tạo mới BOM
router.post('/', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const { code, name, target_item_id, version = '1.0', standard_qty = 1, notes = '', components = [] } = req.body;
    if (!code || !name || !target_item_id) {
      await conn.rollback();
      return res.status(400).json({ error: 'Vui lòng điền đủ Mã, Tên BOM và Sản phẩm đích' });
    }

    const bomId = `BOM-${Date.now()}`;
    await conn.query(`
      INSERT INTO boms (id, code, name, target_item_id, version, standard_qty, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [bomId, code, name, target_item_id, version, standard_qty, notes]);

    for (const comp of components) {
      const biId = `BI-${Date.now()}-${Math.random().toString().slice(-4)}`;
      await conn.query(`
        INSERT INTO bom_items (id, bom_id, item_id, qty, scrap_rate, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [biId, bomId, comp.item_id, comp.qty, comp.scrap_rate || 0, comp.note || '']);
    }

    await conn.commit();
    res.status(201).json({ id: bomId, code, name, message: 'Tạo định mức BOM thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Cập nhật BOM
router.put('/:id', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const { code, name, target_item_id, version, standard_qty, notes, components } = req.body;
    
    await conn.query(`
      UPDATE boms
      SET code = COALESCE(?, code),
          name = COALESCE(?, name),
          target_item_id = COALESCE(?, target_item_id),
          version = COALESCE(?, version),
          standard_qty = COALESCE(?, standard_qty),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `, [code, name, target_item_id, version, standard_qty, notes, req.params.id]);

    if (Array.isArray(components) && components.length > 0) {
      await conn.query('DELETE FROM bom_items WHERE bom_id = ?', [req.params.id]);
      for (const comp of components) {
        const biId = `BI-${Date.now()}-${Math.random().toString().slice(-4)}`;
        await conn.query(`
          INSERT INTO bom_items (id, bom_id, item_id, qty, scrap_rate, note)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [biId, req.params.id, comp.item_id, comp.qty, comp.scrap_rate || 0, comp.note || '']);
      }
    }

    await conn.commit();
    res.json({ message: 'Cập nhật định mức BOM thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Xóa BOM
router.delete('/:id', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [orders] = await conn.query('SELECT COUNT(*) as count FROM production_orders WHERE bom_id = ?', [req.params.id]);
    if (orders && orders[0].count > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Không thể xóa BOM đã phát sinh Lệnh sản xuất (LSX)' });
    }

    await conn.query('DELETE FROM bom_items WHERE bom_id = ?', [req.params.id]);
    await conn.query('DELETE FROM boms WHERE id = ?', [req.params.id]);

    await conn.commit();
    res.json({ message: 'Xóa định mức BOM thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Tính toán nhu cầu vật tư khi lập kế hoạch sản xuất
router.post('/:id/calculate-requirement', async (req, res) => {
  try {
    const plannedQty = Number(req.body.plannedQty || 1);
    const bomRows = await query('SELECT * FROM boms WHERE id = ?', [req.params.id]);
    if (bomRows.length === 0) return res.status(404).json({ error: 'Không tìm thấy BOM' });
    const bom = bomRows[0];

    const components = await query(`
      SELECT bi.*, i.code as item_code, i.name as item_name, i.unit as item_unit, i.cost_price
      FROM bom_items bi
      JOIN items i ON bi.item_id = i.id
      WHERE bi.bom_id = ?
    `, [bom.id]);

    const results = [];
    for (const comp of components) {
      const baseQty = Number(comp.qty);
      const scrap = Number(comp.scrap_rate || 0);
      const reqPerUnit = baseQty * (1 + scrap / 100);
      const totalRequired = reqPerUnit * plannedQty;

      // Kiểm tra tồn kho khả dụng hiện tại ở tất cả các kho NVL/BTP
      const stockRows = await query(`
        SELECT COALESCE(SUM(quantity), 0) as current_stock
        FROM stock
        WHERE item_id = ?
      `, [comp.item_id]);

      const currentStock = Number(stockRows[0].current_stock || 0);
      const shortage = Math.max(0, totalRequired - currentStock);

      results.push({
        itemId: comp.item_id,
        itemCode: comp.item_code,
        itemName: comp.item_name,
        unit: comp.item_unit,
        standardQty: baseQty,
        scrapRate: scrap,
        totalRequired: Number(totalRequired.toFixed(4)),
        currentStock,
        shortage: Number(shortage.toFixed(4)),
        status: shortage > 0 ? 'THIẾU_HÀNG' : 'ĐỦ_HÀNG'
      });
    }

    res.json({
      bomId: bom.id,
      bomCode: bom.code,
      plannedQty,
      requirements: results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
