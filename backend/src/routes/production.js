const express = require('express');
const router = express.Router();
const { query, getConnection } = require('../db');

// Lấy danh sách Lệnh sản xuất (LSX)
router.get('/orders', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT po.*, 
             i.code as target_item_code, i.name as target_item_name, i.unit as target_item_unit, i.type as target_item_type,
             b.code as bom_code, b.name as bom_name,
             w.name as warehouse_name
      FROM production_orders po
      JOIN items i ON po.target_item_id = i.id
      LEFT JOIN boms b ON po.bom_id = b.id
      LEFT JOIN warehouses w ON po.warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND po.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (po.code LIKE ? OR i.name LIKE ? OR po.lot_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY po.date DESC, po.created_at DESC';
    const orders = await query(sql, params);

    const orderIds = orders.map(o => o.id);
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');

      // Lấy công đoạn (stages)
      const stages = await query(`
        SELECT * FROM production_stages
        WHERE production_order_id IN (${placeholders})
        ORDER BY stage_order ASC
      `, orderIds);

      // Lấy cấp phát vật tư (allocations)
      const allocations = await query(`
        SELECT pa.*, i.code as item_code, i.name as item_name, i.unit as item_unit
        FROM production_allocations pa
        JOIN items i ON pa.item_id = i.id
        WHERE pa.production_order_id IN (${placeholders})
      `, orderIds);

      const stageMap = {};
      stages.forEach(s => {
        if (!stageMap[s.production_order_id]) stageMap[s.production_order_id] = [];
        stageMap[s.production_order_id].push(s);
      });

      const allocMap = {};
      allocations.forEach(a => {
        if (!allocMap[a.production_order_id]) allocMap[a.production_order_id] = [];
        allocMap[a.production_order_id].push(a);
      });

      orders.forEach(o => {
        o.stages = stageMap[o.id] || [];
        o.materialAllocations = allocMap[o.id] || [];
        // Tính % tiến độ
        const totalStages = o.stages.length;
        const completedStages = o.stages.filter(s => s.status === 'COMPLETED').length;
        o.progressPercent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
      });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tạo mới Lệnh sản xuất (tự động nhân BOM thành cấp phát kế hoạch)
router.post('/orders', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      code,
      date = new Date().toISOString().split('T')[0],
      target_item_id,
      bom_id,
      planned_qty = 1,
      lot_number,
      warehouse_id,
      notes = '',
      stages = []
    } = req.body;

    if (!target_item_id || !bom_id) {
      await conn.rollback();
      return res.status(400).json({ error: 'Vui lòng chọn Sản phẩm và BOM định mức' });
    }

    const orderId = `LSX-${Date.now()}`;
    const generatedCode = code || `LSX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    const lot = lot_number || `LOT-${generatedCode}`;

    // Lưu lệnh sản xuất
    await conn.query(`
      INSERT INTO production_orders (id, code, date, target_item_id, bom_id, planned_qty, actual_qty, defective_qty, lot_number, warehouse_id, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'DRAFT', ?)
    `, [orderId, generatedCode, date, target_item_id, bom_id, planned_qty, lot, warehouse_id || 'WH-TP', notes]);

    // Tạo các công đoạn mặc định nếu không truyền lên
    const defaultStages = stages.length > 0 ? stages : [
      { name: 'Gia công & Cắt phôi', stage_order: 1 },
      { name: 'Xử lý bề mặt & Sơn mạ', stage_order: 2 },
      { name: 'Lắp ráp hoàn thiện & QC', stage_order: 3 }
    ];

    for (const stg of defaultStages) {
      const stgId = `STG-${Date.now()}-${Math.random().toString().slice(-4)}`;
      await conn.query(`
        INSERT INTO production_stages (id, production_order_id, name, stage_order, status, completed_qty)
        VALUES (?, ?, ?, ?, 'PENDING', 0)
      `, [stgId, orderId, stg.name, stg.stage_order || 1]);
    }

    // Nhân BOM và lưu bản chụp định mức áp dụng (Quy tắc 6)
    const [bomItems] = await conn.query('SELECT * FROM bom_items WHERE bom_id = ?', [bom_id]);
    for (const bi of bomItems) {
      const allocId = `AL-${Date.now()}-${Math.random().toString().slice(-4)}`;
      const reqQty = Number(bi.qty) * (1 + Number(bi.scrap_rate || 0) / 100) * Number(planned_qty);

      // Tìm lô có sẵn trong kho NVL
      const [availLots] = await conn.query(`
        SELECT lot_number FROM stock 
        WHERE item_id = ? AND quantity > 0 
        ORDER BY quantity DESC LIMIT 1
      `, [bi.item_id]);

      const suggestedLot = availLots.length > 0 ? availLots[0].lot_number : 'LOT-NVL-AUTO';

      await conn.query(`
        INSERT INTO production_allocations (id, production_order_id, item_id, planned_qty, allocated_qty, actual_used_qty, lot_number)
        VALUES (?, ?, ?, ?, 0, 0, ?)
      `, [allocId, orderId, bi.item_id, reqQty, suggestedLot]);
    }

    await conn.commit();
    res.status(201).json({ id: orderId, code: generatedCode, message: 'Tạo lệnh sản xuất thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Cập nhật trạng thái LSX (DRAFT -> RELEASED -> IN_PROGRESS -> COMPLETED -> CLOSED)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE production_orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Cập nhật trạng thái thành công', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật tiến độ công đoạn
router.put('/orders/:id/stages/:stageId', async (req, res) => {
  try {
    const { status, completed_qty } = req.body;
    await query(`
      UPDATE production_stages 
      SET status = COALESCE(?, status),
          completed_qty = COALESCE(?, completed_qty)
      WHERE id = ? AND production_order_id = ?
    `, [status, completed_qty, req.params.stageId, req.params.id]);

    res.json({ message: 'Cập nhật công đoạn thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cấp phát vật tư từ kho NVL sang Kho sản xuất theo đợt (Quy tắc 4 & 7)
router.post('/orders/:id/allocate', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const orderId = req.params.id;
    let { sourceWarehouseId = 'WH-NVL', destWarehouseId = 'WH-SX', allocations = [] } = req.body;

    // Tự động phân giải ID kho nếu truyền ID tạm, Mã kho hoặc Loại kho
    const [srcWhRows] = await conn.query('SELECT id FROM warehouses WHERE id = ? OR code = ? OR type = "NVL" LIMIT 1', [sourceWarehouseId, sourceWarehouseId]);
    if (srcWhRows.length > 0) sourceWarehouseId = srcWhRows[0].id;

    const [destWhRows] = await conn.query('SELECT id FROM warehouses WHERE id = ? OR code = ? OR type = "SX" LIMIT 1', [destWarehouseId, destWarehouseId]);
    if (destWhRows.length > 0) destWarehouseId = destWhRows[0].id;

    const [orderRows] = await conn.query('SELECT * FROM production_orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy lệnh sản xuất' });
    }
    const order = orderRows[0];

    // Tạo phiếu xuất kho chuyển sang xưởng sản xuất
    const txId = `ST-${Date.now()}`;
    const txCode = `PXK-SX-${Date.now().toString().slice(-6)}`;

    await conn.query(`
      INSERT INTO stock_transactions (id, code, date, type, status, source_warehouse_id, dest_warehouse_id, ref_code, note)
      VALUES (?, ?, CURDATE(), 'TRANSFER', 'POSTED', ?, ?, ?, ?)
    `, [txId, txCode, sourceWarehouseId, destWarehouseId, order.code, `Cấp phát vật tư cho ${order.code}`]);

    for (const alloc of allocations) {
      const qty = Number(alloc.qty || 0);
      if (qty <= 0) continue;

      // Giảm kho NVL
      await conn.query(`
        UPDATE stock 
        SET quantity = quantity - ? 
        WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
      `, [qty, sourceWarehouseId, alloc.itemId, alloc.lotNumber]);

      // Tăng kho SX
      const [destExist] = await conn.query(`
        SELECT id FROM stock 
        WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
      `, [destWarehouseId, alloc.itemId, alloc.lotNumber]);

      if (destExist.length > 0) {
        await conn.query(`
          UPDATE stock 
          SET quantity = quantity + ? 
          WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
        `, [qty, destWarehouseId, alloc.itemId, alloc.lotNumber]);
      } else {
        await conn.query(`
          INSERT INTO stock (id, warehouse_id, item_id, lot_number, quantity)
          VALUES (?, ?, ?, ?, ?)
        `, [`STK-${Date.now()}-${Math.random().toString().slice(-4)}`, destWarehouseId, alloc.itemId, alloc.lotNumber, qty]);
      }

      // Ghi nhận item trong transaction
      await conn.query(`
        INSERT INTO stock_transaction_items (id, transaction_id, item_id, lot_number, qty, price)
        VALUES (?, ?, ?, ?, ?, 0)
      `, [`STI-${Date.now()}-${Math.random().toString().slice(-4)}`, txId, alloc.itemId, alloc.lotNumber, qty]);

      // Cập nhật số lượng đã cấp phát trong production_allocations
      await conn.query(`
        UPDATE production_allocations 
        SET allocated_qty = allocated_qty + ?, 
            actual_used_qty = actual_used_qty + ?
        WHERE production_order_id = ? AND item_id = ?
      `, [qty, qty, orderId, alloc.itemId]);
    }

    // Chuyển trạng thái LSX sang IN_PROGRESS nếu đang DRAFT hoặc RELEASED
    await conn.query(`
      UPDATE production_orders 
      SET status = 'IN_PROGRESS' 
      WHERE id = ? AND status IN ('DRAFT', 'RELEASED')
    `, [orderId]);

    await conn.commit();
    res.json({ message: 'Cấp phát vật tư thành công', txCode });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Hoàn thành lệnh sản xuất & Nhập kho BTP/TP theo số lô (Quy tắc 8)
router.post('/orders/:id/finish', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const orderId = req.params.id;
    const { actualQty, defectiveQty = 0, destWarehouseId, note = '' } = req.body;

    const [orderRows] = await conn.query(`
      SELECT po.*, i.type as item_type, i.cost_price 
      FROM production_orders po
      JOIN items i ON po.target_item_id = i.id
      WHERE po.id = ?
    `, [orderId]);

    if (orderRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy lệnh sản xuất' });
    }
    const order = orderRows[0];
    const qtyProduced = Number(actualQty || order.planned_qty);

    // Xác định kho nhận: Nếu BTP -> BTP, Nếu TP -> TP
    let targetWhId = destWarehouseId;
    if (!targetWhId) {
      const neededType = order.item_type === 'BTP' ? 'BTP' : 'TP';
      const [whTargetRows] = await conn.query('SELECT id FROM warehouses WHERE type = ? LIMIT 1', [neededType]);
      targetWhId = whTargetRows.length > 0 ? whTargetRows[0].id : (order.item_type === 'BTP' ? 'WH-BTP' : 'WH-TP');
    }

    // Kho nguồn SX
    let sxWhId = 'WH-SX';
    const [sxWhRows] = await conn.query('SELECT id FROM warehouses WHERE type = "SX" LIMIT 1');
    if (sxWhRows.length > 0) sxWhId = sxWhRows[0].id;

    // Tạo phiếu nhập kho từ sản xuất
    const txId = `ST-${Date.now()}`;
    const txCode = `PNK-SX-${Date.now().toString().slice(-6)}`;

    await conn.query(`
      INSERT INTO stock_transactions (id, code, date, type, status, source_warehouse_id, dest_warehouse_id, ref_code, note)
      VALUES (?, ?, CURDATE(), 'IN_PRODUCTION', 'POSTED', ?, ?, ?, ?)
    `, [txId, txCode, sxWhId, targetWhId, order.code, `Nhập kho từ ${order.code}. ${note}`]);

    await conn.query(`
      INSERT INTO stock_transaction_items (id, transaction_id, item_id, lot_number, qty, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [`STI-${Date.now()}`, txId, order.target_item_id, order.lot_number, qtyProduced, order.cost_price || 0]);

    // Tăng tồn kho tại kho đích
    const [exist] = await conn.query(`
      SELECT id FROM stock 
      WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
    `, [targetWhId, order.target_item_id, order.lot_number]);

    if (exist.length > 0) {
      await conn.query(`
        UPDATE stock 
        SET quantity = quantity + ? 
        WHERE warehouse_id = ? AND item_id = ? AND lot_number = ?
      `, [qtyProduced, targetWhId, order.target_item_id, order.lot_number]);
    } else {
      await conn.query(`
        INSERT INTO stock (id, warehouse_id, item_id, lot_number, quantity)
        VALUES (?, ?, ?, ?, ?)
      `, [`STK-${Date.now()}`, targetWhId, order.target_item_id, order.lot_number, qtyProduced]);
    }

    // Cập nhật trạng thái LSX sang COMPLETED
    await conn.query(`
      UPDATE production_orders 
      SET actual_qty = ?, defective_qty = ?, status = 'COMPLETED' 
      WHERE id = ?
    `, [qtyProduced, defectiveQty, orderId]);

    // Đánh dấu các công đoạn hoàn thành
    await conn.query(`
      UPDATE production_stages 
      SET status = 'COMPLETED', completed_qty = ?
      WHERE production_order_id = ?
    `, [qtyProduced, orderId]);

    await conn.commit();
    res.json({ message: 'Hoàn thành lệnh sản xuất và nhập kho thành công', txCode, actualQty: qtyProduced });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Xóa Lệnh sản xuất (LSX)
router.delete('/orders/:id', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT status FROM production_orders WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy Lệnh sản xuất' });
    }
    if (rows[0].status === 'COMPLETED') {
      await conn.rollback();
      return res.status(400).json({ error: 'Không thể xóa Lệnh sản xuất đã hoàn thành và nhập kho thành phẩm' });
    }

    await conn.query('DELETE FROM production_stages WHERE production_order_id = ?', [req.params.id]);
    await conn.query('DELETE FROM production_allocations WHERE production_order_id = ?', [req.params.id]);
    await conn.query('DELETE FROM production_orders WHERE id = ?', [req.params.id]);

    await conn.commit();
    res.json({ message: 'Xóa Lệnh sản xuất thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
