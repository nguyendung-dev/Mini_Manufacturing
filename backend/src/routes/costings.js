const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Danh sách các bảng tính giá thành theo Lệnh sản xuất
router.get('/', async (req, res) => {
  try {
    const list = await query(`
      SELECT c.*, po.code as production_order_code, po.target_item_id
      FROM cost_calculations c
      JOIN production_orders po ON c.production_order_id = po.id
      ORDER BY c.date DESC, c.created_at DESC
    `);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tính toán & Kết chuyển giá thành cho 1 Lệnh sản xuất
router.post('/calculate', async (req, res) => {
  try {
    const { production_order_id, labor_cost = 0, overhead_cost = 0 } = req.body;

    const [orderRows] = await query(`
      SELECT po.*, i.code as target_item_code, i.name as target_item_name, i.cost_price as standard_price
      FROM production_orders po
      JOIN items i ON po.target_item_id = i.id
      WHERE po.id = ?
    `, [production_order_id]);

    if (orderRows.length === 0) return res.status(404).json({ error: 'Không tìm thấy lệnh sản xuất' });
    const order = orderRows[0];

    // Lấy danh sách NVL thực tế đã cấp phát / dùng
    const allocations = await query(`
      SELECT pa.*, i.cost_price
      FROM production_allocations pa
      JOIN items i ON pa.item_id = i.id
      WHERE pa.production_order_id = ?
    `, [production_order_id]);

    let materialCost = 0;
    allocations.forEach(a => {
      const usedQty = Number(a.actual_used_qty || a.allocated_qty || a.planned_qty);
      materialCost += usedQty * Number(a.cost_price || 0);
    });

    const lCost = Number(labor_cost);
    const oCost = Number(overhead_cost);
    const totalCost = materialCost + lCost + oCost;
    const completedQty = Number(order.actual_qty || order.planned_qty) || 1;
    const unitCost = Number((totalCost / completedQty).toFixed(2));
    const standardBomCost = Number(order.standard_price || unitCost);
    const variance = Number((unitCost - standardBomCost).toFixed(2));

    const costId = `COST-${Date.now()}`;
    await query(`
      INSERT INTO cost_calculations 
      (id, production_order_id, date, target_item_code, target_item_name, completed_qty, material_cost, labor_cost, overhead_cost, total_cost, unit_cost, standard_bom_cost, variance)
      VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [costId, production_order_id, order.target_item_code, order.target_item_name, completedQty, materialCost, lCost, oCost, totalCost, unitCost, standardBomCost, variance]);

    res.status(201).json({
      id: costId,
      production_order_id,
      completedQty,
      materialCost,
      laborCost: lCost,
      overheadCost: oCost,
      totalCost,
      unitCost,
      standardBomCost,
      variance,
      message: 'Tính toán và lưu giá thành thành công'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
