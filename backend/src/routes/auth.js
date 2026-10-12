const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Ma trận quyền mặc định
const DEFAULT_PERMISSIONS = {
  ADMIN: {
    dashboard: true,
    catalog: true,
    inventory_view: true,
    inventory_manage: true,
    boms: true,
    production_view: true,
    production_manage: true,
    orders: true,
    finance: true,
    costings: true,
    role_matrix: true
  },
  MANAGER: {
    dashboard: true,
    catalog: true,
    inventory_view: true,
    inventory_manage: true,
    boms: true,
    production_view: true,
    production_manage: true,
    orders: true,
    finance: false,
    costings: true,
    role_matrix: false
  },
  WAREHOUSE: {
    dashboard: true,
    catalog: true,
    inventory_view: true,
    inventory_manage: true,
    boms: true,
    production_view: true,
    production_manage: false,
    orders: true,
    finance: false,
    costings: false,
    role_matrix: false
  },
  PRODUCTION: {
    dashboard: false,
    catalog: false,
    inventory_view: true,
    inventory_manage: false,
    boms: true,
    production_view: true,
    production_manage: true,
    orders: false,
    finance: false,
    costings: false,
    role_matrix: false
  },
  ACCOUNTANT: {
    dashboard: true,
    catalog: true,
    inventory_view: true,
    inventory_manage: false,
    boms: false,
    production_view: true,
    production_manage: false,
    orders: true,
    finance: true,
    costings: true,
    role_matrix: false
  }
};

let currentPermissions = { ...DEFAULT_PERMISSIONS };

// Khởi tạo bảng users và ma trận quyền nếu chưa có
async function initAuthTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'WAREHOUSE',
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS role_matrix (
      role VARCHAR(30) PRIMARY KEY,
      permissions JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Seed tài khoản mặc định nếu chưa có
  const [usersCount] = await query('SELECT COUNT(*) as count FROM users');
  if (usersCount.count === 0) {
    await query(`
      INSERT INTO users (id, username, password, full_name, role, phone) VALUES
      ('USR-ADMIN', 'admin', 'admin123', 'Nguyễn Văn Quản Trị (Chủ xưởng)', 'ADMIN', '0901.111.222'),
      ('USR-MANAGER', 'quanly', '123456', 'Trần Đình Quản Đốc (Sản xuất)', 'MANAGER', '0902.222.333'),
      ('USR-KHO', 'thukho', '123456', 'Lê Văn Kho (Thủ kho chính)', 'WAREHOUSE', '0903.333.444'),
      ('USR-SX', 'sanxuat', '123456', 'Phạm Công Đoạn (Tổ trưởng SX)', 'PRODUCTION', '0904.444.555'),
      ('USR-KETOAN', 'ketoan', '123456', 'Hoàng Thị Kế Toán (Nội bộ)', 'ACCOUNTANT', '0905.555.666');
    `);
  }

  // Seed ma trận phân quyền nếu chưa có
  const [matrixCount] = await query('SELECT COUNT(*) as count FROM role_matrix');
  if (matrixCount.count === 0) {
    for (const [role, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
      await query(`
        INSERT INTO role_matrix (role, permissions) VALUES (?, ?)
      `, [role, JSON.stringify(perms)]);
    }
  } else {
    // Load từ DB
    const matrixRows = await query('SELECT * FROM role_matrix');
    matrixRows.forEach(row => {
      try {
        currentPermissions[row.role] = typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions;
      } catch (e) {}
    });
  }
}

// Khởi chạy tạo bảng ngay
initAuthTables().catch(console.error);

// 1. ĐĂNG KÝ
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, role = 'WAREHOUSE', phone = '' } = req.body;
    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Vui lòng điền đủ Tên đăng nhập, Mật khẩu và Họ tên' });
    }

    const existing = await query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Tên đăng nhập này đã được sử dụng' });
    }

    const id = `USR-${Date.now()}`;
    await query(`
      INSERT INTO users (id, username, password, full_name, role, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, username.trim(), password, full_name.trim(), role, phone]);

    const newUser = { id, username: username.trim(), full_name: full_name.trim(), role, phone };
    const permissions = currentPermissions[role] || DEFAULT_PERMISSIONS[role] || {};

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      user: newUser,
      permissions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. ĐĂNG NHẬP
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const users = await query(`
      SELECT id, username, password, full_name, role, phone 
      FROM users 
      WHERE username = ?
    `, [username.trim()]);

    if (users.length === 0 || users[0].password !== password) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    const user = {
      id: users[0].id,
      username: users[0].username,
      full_name: users[0].full_name,
      role: users[0].role,
      phone: users[0].phone
    };

    const permissions = currentPermissions[user.role] || DEFAULT_PERMISSIONS[user.role] || {};

    res.json({
      message: 'Đăng nhập thành công',
      user,
      permissions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DANH SÁCH TÀI KHOẢN
router.get('/users', async (req, res) => {
  try {
    const list = await query('SELECT id, username, full_name, role, phone, created_at FROM users ORDER BY created_at ASC');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. LẤY MA TRẬN PHÂN QUYỀN
router.get('/permissions', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM role_matrix');
    const matrix = {};
    rows.forEach(r => {
      matrix[r.role] = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions;
    });
    res.json(Object.keys(matrix).length > 0 ? matrix : currentPermissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. CẬP NHẬT MA TRẬN PHÂN QUYỀN
router.put('/permissions', async (req, res) => {
  try {
    const updatedMatrix = req.body; // { ADMIN: {...}, MANAGER: {...}, ... }
    for (const [role, perms] of Object.entries(updatedMatrix)) {
      currentPermissions[role] = perms;
      await query(`
        INSERT INTO role_matrix (role, permissions) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE permissions = VALUES(permissions)
      `, [role, JSON.stringify(perms)]);
    }
    res.json({ message: 'Cập nhật ma trận phân quyền thành công', matrix: currentPermissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
