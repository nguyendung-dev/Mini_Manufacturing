const express = require('express');
const router = express.Router();
const { query, getConnection } = require('../db');

// --- PHIẾU THU (CASH RECEIPTS) ---
router.get('/receipts', async (req, res) => {
  try {
    const list = await query(`
      SELECT cr.*, p.name as partner_name, p.code as partner_code
      FROM cash_receipts cr
      LEFT JOIN partners p ON cr.partner_id = p.id
      ORDER BY cr.date DESC, cr.created_at DESC
    `);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/receipts', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      code,
      date = new Date().toISOString().split('T')[0],
      partner_id,
      type = 'SALE',
      payment_method = 'BANK',
      amount = 0,
      ref_code = '',
      note = ''
    } = req.body;

    const receiptAmount = Number(amount);
    if (receiptAmount <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Số tiền thu phải lớn hơn 0' });
    }

    const receiptId = `PT-${Date.now()}`;
    const generatedCode = code || `PT-${Date.now().toString().slice(-6)}`;

    await conn.query(`
      INSERT INTO cash_receipts (id, code, date, partner_id, type, payment_method, amount, ref_code, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [receiptId, generatedCode, date, partner_id || null, type, payment_method, receiptAmount, ref_code, note]);

    // Nếu thu từ khách hàng, giảm công nợ khách hàng
    if (partner_id) {
      await conn.query('UPDATE partners SET debt = debt - ? WHERE id = ?', [receiptAmount, partner_id]);
    }

    // Nếu có gắn với ref_code là đơn bán (SO), cập nhật paid_amount của đơn bán
    if (ref_code) {
      await conn.query('UPDATE sales_orders SET paid_amount = paid_amount + ? WHERE code = ?', [receiptAmount, ref_code]);
    }

    await conn.commit();
    res.status(201).json({ id: receiptId, code: generatedCode, amount: receiptAmount, message: 'Tạo phiếu thu thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// --- PHIẾU CHI (CASH PAYMENTS) ---
router.get('/payments', async (req, res) => {
  try {
    const list = await query(`
      SELECT cp.*, p.name as partner_name, p.code as partner_code
      FROM cash_payments cp
      LEFT JOIN partners p ON cp.partner_id = p.id
      ORDER BY cp.date DESC, cp.created_at DESC
    `);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments', async (req, res) => {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const {
      code,
      date = new Date().toISOString().split('T')[0],
      partner_id,
      type = 'PURCHASE', // PURCHASE | SALARY | OVERHEAD | OTHER
      payment_method = 'BANK',
      amount = 0,
      ref_code = '',
      note = ''
    } = req.body;

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Số tiền chi phải lớn hơn 0' });
    }

    const paymentId = `PC-${Date.now()}`;
    const generatedCode = code || `PC-${Date.now().toString().slice(-6)}`;

    await conn.query(`
      INSERT INTO cash_payments (id, code, date, partner_id, type, payment_method, amount, ref_code, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [paymentId, generatedCode, date, partner_id || null, type, payment_method, paymentAmount, ref_code, note]);

    // Nếu chi trả nhà cung cấp, giảm công nợ phải trả
    if (partner_id) {
      await conn.query('UPDATE partners SET debt = debt - ? WHERE id = ?', [paymentAmount, partner_id]);
    }

    // Nếu ref_code là đơn mua (PO), cập nhật paid_amount của PO
    if (ref_code) {
      await conn.query('UPDATE purchase_orders SET paid_amount = paid_amount + ? WHERE code = ?', [paymentAmount, ref_code]);
    }

    await conn.commit();
    res.status(201).json({ id: paymentId, code: generatedCode, amount: paymentAmount, message: 'Tạo phiếu chi thành công' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// --- SỔ QUỸ & CÔNG NỢ TỔNG HỢP ---
router.get('/cash-flow', async (req, res) => {
  try {
    const receipts = await query('SELECT payment_method, SUM(amount) as total FROM cash_receipts GROUP BY payment_method');
    const payments = await query('SELECT payment_method, SUM(amount) as total FROM cash_payments GROUP BY payment_method');

    let cashIn = 0, cashOut = 0, bankIn = 0, bankOut = 0;

    receipts.forEach(r => {
      if (r.payment_method === 'CASH') cashIn = Number(r.total);
      if (r.payment_method === 'BANK') bankIn = Number(r.total);
    });

    payments.forEach(p => {
      if (p.payment_method === 'CASH') cashOut = Number(p.total);
      if (p.payment_method === 'BANK') bankOut = Number(p.total);
    });

    res.json({
      cash: { in: cashIn, out: cashOut, balance: cashIn - cashOut },
      bank: { in: bankIn, out: bankOut, balance: bankIn - bankOut },
      totalIn: cashIn + bankIn,
      totalOut: cashOut + bankOut,
      netBalance: (cashIn + bankIn) - (cashOut + bankOut)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
