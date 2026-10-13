const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Dashboard KPIs
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Thống kê giá trị tồn kho theo loại
    const stockValuation = await query(`
      SELECT i.type, SUM(s.quantity * i.cost_price) as total_value, SUM(s.quantity) as total_qty
      FROM stock s
      JOIN items i ON s.item_id = i.id
      GROUP BY i.type
    `);

    // 2. Thống kê lệnh sản xuất
    const ordersStat = await query(`
      SELECT status, COUNT(*) as count 
      FROM production_orders 
      GROUP BY status
    `);

    // 3. Công nợ
    const debtStat = await query(`
      SELECT type, SUM(debt) as total_debt 
      FROM partners 
      GROUP BY type
    `);

    // 4. Doanh số & Mua hàng
    const salesTotal = await query('SELECT SUM(total_amount) as total, SUM(paid_amount) as paid FROM sales_orders');
    const purchaseTotal = await query('SELECT SUM(total_amount) as total, SUM(paid_amount) as paid FROM purchase_orders');

    // 5. Cảnh báo mặt hàng dưới tồn kho an toàn (min_stock)
    const lowStockAlerts = await query(`
      SELECT i.id, i.code, i.name, i.unit, i.min_stock, COALESCE(SUM(s.quantity), 0) as current_stock
      FROM items i
      LEFT JOIN stock s ON i.id = s.item_id
      GROUP BY i.id, i.code, i.name, i.unit, i.min_stock
      HAVING current_stock < i.min_stock AND i.min_stock > 0
    `);

    // 6. Giao dịch kho gần đây (5 phiếu mới nhất)
    const recentTransactions = await query(`
      SELECT st.*, sw.name as source_wh, dw.name as dest_wh
      FROM stock_transactions st
      LEFT JOIN warehouses sw ON st.source_warehouse_id = sw.id
      LEFT JOIN warehouses dw ON st.dest_warehouse_id = dw.id
      ORDER BY st.date DESC, st.created_at DESC
      LIMIT 5
    `);

    let inventoryByType = { NVL: 0, BTP: 0, TP: 0 };
    stockValuation.forEach(row => {
      inventoryByType[row.type] = Number(row.total_value || 0);
    });

    let productionCount = { DRAFT: 0, RELEASED: 0, IN_PROGRESS: 0, COMPLETED: 0, CLOSED: 0 };
    ordersStat.forEach(row => {
      productionCount[row.status] = Number(row.count || 0);
    });

    let customerDebt = 0;
    let supplierDebt = 0;
    debtStat.forEach(row => {
      if (row.type === 'CUSTOMER') customerDebt = Number(row.total_debt || 0);
      if (row.type === 'SUPPLIER') supplierDebt = Number(row.total_debt || 0);
    });

    res.json({
      inventoryByType,
      totalInventoryValue: Object.values(inventoryByType).reduce((a, b) => a + b, 0),
      productionCount,
      activeProductionOrders: (productionCount.IN_PROGRESS || 0) + (productionCount.RELEASED || 0),
      debts: {
        receivable: customerDebt, // Phải thu khách hàng
        payable: supplierDebt     // Phải trả nhà cung cấp
      },
      salesRevenue: Number(salesTotal[0]?.total || 0),
      purchaseExpense: Number(purchaseTotal[0]?.total || 0),
      lowStockAlerts,
      recentTransactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Báo cáo tổng hợp Nhập - Xuất - Tồn theo kho và hàng hóa
router.get('/inventory-summary', async (req, res) => {
  try {
    const list = await query(`
      SELECT 
        i.code as item_code, 
        i.name as item_name, 
        i.unit, 
        i.type as item_type,
        w.name as warehouse_name,
        COALESCE(SUM(s.quantity), 0) as current_quantity,
        i.cost_price,
        COALESCE(SUM(s.quantity * i.cost_price), 0) as total_value
      FROM items i
      CROSS JOIN warehouses w
      LEFT JOIN stock s ON s.item_id = i.id AND s.warehouse_id = w.id
      GROUP BY i.id, w.id
      HAVING current_quantity > 0
      ORDER BY w.code, i.type, i.code
    `);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Tìm kiếm toàn hệ thống theo Mã (PO, SO, LSX, BOM, LOT, Item Code)
router.get('/global-search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }
    const term = `%${q}%`;
    const results = [];

    // 1. Lệnh sản xuất (LSX)
    try {
      const lsxList = await query(
        `SELECT po.id, po.code, po.status, po.planned_qty, i.name as item_name 
         FROM production_orders po
         LEFT JOIN items i ON po.target_item_id = i.id
         WHERE po.code LIKE ? OR i.name LIKE ?
         LIMIT 4`,
        [term, term]
      );
      lsxList.forEach(item => {
        results.push({
          type: 'production',
          module: 'production',
          badge: 'Lệnh SX',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          code: item.code,
          title: item.code,
          subtitle: `${item.item_name || 'Sản phẩm'} • SL kế hoạch: ${item.planned_qty} • ${item.status}`,
          targetId: item.id
        });
      });
    } catch (e) {
      console.error('LSX search err:', e.message);
    }

    // 2. Đơn mua hàng (PO)
    try {
      const poList = await query(
        `SELECT po.id, po.code, po.status, po.total_amount, p.name as partner_name
         FROM purchase_orders po
         LEFT JOIN partners p ON po.partner_id = p.id
         WHERE po.code LIKE ? OR p.name LIKE ?
         LIMIT 4`,
        [term, term]
      );
      poList.forEach(item => {
        results.push({
          type: 'orders',
          module: 'orders',
          tab: 'purchase',
          badge: 'Đơn mua (PO)',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          code: item.code,
          title: item.code,
          subtitle: `NCC: ${item.partner_name || 'Không rõ'} • ${Number(item.total_amount || 0).toLocaleString()} đ • ${item.status}`,
          targetId: item.id
        });
      });
    } catch (e) {
      console.error('PO search err:', e.message);
    }

    // 3. Đơn bán hàng (SO)
    try {
      const soList = await query(
        `SELECT so.id, so.code, so.status, so.total_amount, p.name as partner_name
         FROM sales_orders so
         LEFT JOIN partners p ON so.partner_id = p.id
         WHERE so.code LIKE ? OR p.name LIKE ?
         LIMIT 4`,
        [term, term]
      );
      soList.forEach(item => {
        results.push({
          type: 'orders',
          module: 'orders',
          tab: 'sales',
          badge: 'Đơn bán (SO)',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          code: item.code,
          title: item.code,
          subtitle: `Khách: ${item.partner_name || 'Không rõ'} • ${Number(item.total_amount || 0).toLocaleString()} đ • ${item.status}`,
          targetId: item.id
        });
      });
    } catch (e) {
      console.error('SO search err:', e.message);
    }

    // 4. Định mức kỹ thuật (BOM)
    try {
      const bomList = await query(
        `SELECT b.id, b.code, b.name, b.status, i.name as item_name
         FROM boms b
         LEFT JOIN items i ON b.item_id = i.id
         WHERE b.code LIKE ? OR b.name LIKE ?
         LIMIT 4`,
        [term, term]
      );
      bomList.forEach(item => {
        results.push({
          type: 'boms',
          module: 'boms',
          badge: 'BOM',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          code: item.code,
          title: `${item.code} - ${item.name}`,
          subtitle: `TP: ${item.item_name || 'Chưa gán'} • ${item.status}`,
          targetId: item.id
        });
      });
    } catch (e) {
      console.error('BOM search err:', e.message);
    }

    // 5. Số lô kho (LOT)
    try {
      const lotList = await query(
        `SELECT sl.id, sl.lot_number, sl.current_qty, i.name as item_name, i.code as item_code
         FROM stock_lots sl
         LEFT JOIN items i ON sl.item_id = i.id
         WHERE sl.lot_number LIKE ?
         LIMIT 4`,
        [term]
      );
      lotList.forEach(item => {
        results.push({
          type: 'inventory',
          module: 'inventory',
          lotNumber: item.lot_number,
          badge: 'Số Lô',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          code: item.lot_number,
          title: `Lô: ${item.lot_number}`,
          subtitle: `${item.item_name || ''} (${item.item_code}) • Tồn: ${item.current_qty}`,
          targetId: item.id
        });
      });
    } catch (e) {
      console.error('LOT search err:', e.message);
    }

    // 6. Danh mục vật tư / sản phẩm
    try {
      const itemList = await query(
        `SELECT id, code, name, type, unit, cost_price
         FROM items
         WHERE code LIKE ? OR name LIKE ?
         LIMIT 4`,
        [term, term]
      );
      itemList.forEach(item => {
        results.push({
          type: 'catalog',
          module: 'catalog',
          badge: item.type,
          badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200',
          code: item.code,
          title: `${item.code} - ${item.name}`,
          subtitle: `ĐVT: ${item.unit} • Giá vốn: ${Number(item.cost_price || 0).toLocaleString()} đ`,
          targetId: item.id
        });
      });
    } catch (e) {
      console.error('Item search err:', e.message);
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Danh sách Thông báo thời gian thực cho Trung tâm thông báo Header
router.get('/notifications', async (req, res) => {
  try {
    const notifications = [];

    // 1. Cảnh báo vật tư dưới mức tồn an toàn
    const lowStock = await query(`
      SELECT i.id, i.code, i.name, i.unit, i.min_stock, COALESCE(SUM(s.quantity), 0) as current_stock
      FROM items i
      LEFT JOIN stock s ON i.id = s.item_id
      GROUP BY i.id, i.code, i.name, i.unit, i.min_stock
      HAVING current_stock < i.min_stock AND i.min_stock > 0
      LIMIT 5
    `);
    lowStock.forEach(item => {
      notifications.push({
        id: `stock-${item.id}`,
        level: 'warning',
        title: `Cảnh báo tồn kho tối thiểu`,
        message: `${item.name} (${item.code}) hiện chỉ còn ${item.current_stock} ${item.unit} (Mức an toàn: ${item.min_stock} ${item.unit})`,
        time: 'Vừa xong',
        module: 'inventory',
        icon: 'warning'
      });
    });

    // 2. Lệnh sản xuất đang thực thi
    const activeLsx = await query(`
      SELECT po.id, po.code, po.status, po.planned_qty, i.name as item_name
      FROM production_orders po
      LEFT JOIN items i ON po.target_item_id = i.id
      WHERE po.status IN ('RELEASED', 'IN_PROGRESS')
      ORDER BY po.id DESC
      LIMIT 3
    `);
    activeLsx.forEach(lsx => {
      notifications.push({
        id: `lsx-${lsx.id}`,
        level: 'info',
        title: `Tiến độ sản xuất`,
        message: `Lệnh ${lsx.code} (${lsx.item_name}) đang ở trạng thái ${lsx.status === 'IN_PROGRESS' ? 'Đang gia công' : 'Đã duyệt sẵn sàng'}`,
        time: 'Hôm nay',
        module: 'production',
        targetId: lsx.id,
        icon: 'cog'
      });
    });

    // 3. Đơn mua hàng chờ giao
    const pendingPo = await query(`
      SELECT po.id, po.code, p.name as partner_name, po.total_amount
      FROM purchase_orders po
      LEFT JOIN partners p ON po.partner_id = p.id
      WHERE po.status IN ('PENDING', 'DRAFT', 'ORDERED')
      ORDER BY po.id DESC
      LIMIT 3
    `);
    pendingPo.forEach(po => {
      notifications.push({
        id: `po-${po.id}`,
        level: 'info',
        title: `Đơn mua hàng chờ nhập kho`,
        message: `Đơn ${po.code} từ ${po.partner_name || 'NCC'} trị giá ${Number(po.total_amount || 0).toLocaleString()} đ cần theo dõi tiến độ nhập kho`,
        time: 'Gần đây',
        module: 'orders',
        tab: 'purchase',
        icon: 'shopping-cart'
      });
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
