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

module.exports = router;
