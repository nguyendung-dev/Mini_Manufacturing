import React, { useState } from 'react';
import { fetchApi } from '../api';

export default function LoginView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branch, setBranch] = useState('factory_hn');

  // Form đăng nhập
  const [loginData, setLoginData] = useState({
    username: 'admin',
    password: 'admin123'
  });

  // Form đăng ký
  const [regData, setRegData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'WAREHOUSE',
    phone: ''
  });

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      localStorage.setItem('erp_user', JSON.stringify(res.user));
      localStorage.setItem('erp_permissions', JSON.stringify(res.permissions));
      onLoginSuccess(res.user, res.permissions);
    } catch (err) {
      setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(regData)
      });
      alert('Đăng ký tài khoản nhân viên thành công.');
      localStorage.setItem('erp_user', JSON.stringify(res.user));
      localStorage.setItem('erp_permissions', JSON.stringify(res.permissions));
      onLoginSuccess(res.user, res.permissions);
    } catch (err) {
      setError(err.message || 'Không thể tạo tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname, pwd) => {
    setLoginData({ username: uname, password: pwd });
    setLoading(true);
    setError('');
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: uname, password: pwd })
    }).then(res => {
      localStorage.setItem('erp_user', JSON.stringify(res.user));
      localStorage.setItem('erp_permissions', JSON.stringify(res.permissions));
      onLoginSuccess(res.user, res.permissions);
    }).catch(err => {
      setError(err.message || 'Đăng nhập không thành công');
    }).finally(() => {
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50/80 flex flex-col justify-center items-center p-4 font-sans text-zinc-950 antialiased">
      {/* Khối Card phong cách shadcn/ui (Authentication-01) */}
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
        
        {/* Header với Icon tối giản */}
        <div className="text-center mb-6">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs mx-auto mb-3 shadow-sm">
            HT
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
            {!isRegister ? 'Đăng nhập HT softtech' : 'Tạo tài khoản mới'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {!isRegister
              ? 'Hệ thống Quản trị Sản xuất & Kho HT softtech ERP'
              : 'Đăng ký tài khoản phân quyền làm việc nội bộ'}
          </p>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {!isRegister ? (
          /* FORM ĐĂNG NHẬP */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1.5 block">
                Nhà máy / Phân xưởng
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 cursor-pointer"
              >
                <option value="factory_hn">Nhà máy Cơ khí HT softtech (Hà Nội)</option>
                <option value="warehouse_central">Kho Tổng Vật tư & Bán thành phẩm</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1.5 block">
                Tài khoản / Mã nhân viên
              </label>
              <input
                type="text"
                required
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="admin, thukho, quanly..."
                className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-900">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="••••••••"
                className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-9 w-full rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-50 shadow hover:bg-zinc-850 active:bg-zinc-950 transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          /* FORM ĐĂNG KÝ */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1 block">
                Họ và tên nhân sự (*)
              </label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={regData.full_name}
                onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-zinc-900 mb-1 block">
                  Username (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="username"
                  value={regData.username}
                  onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-900 mb-1 block">
                  Mật khẩu (*)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1 block">
                Vai trò bộ phận (*)
              </label>
              <select
                value={regData.role}
                onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 cursor-pointer"
              >
                <option value="WAREHOUSE">Thủ kho (NVL, BTP, TP)</option>
                <option value="PRODUCTION">Tổ trưởng SX (Lệnh & Công đoạn)</option>
                <option value="ACCOUNTANT">Kế toán nội bộ (Sổ quỹ & Giá thành)</option>
                <option value="MANAGER">Quản đốc phân xưởng</option>
                <option value="ADMIN">Ban Giám Đốc (Toàn quyền)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-9 w-full rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-50 shadow hover:bg-zinc-800 transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Đang khởi tạo...' : 'Tạo tài khoản'}
            </button>
          </form>
        )}

        {/* Chuyển đổi đăng nhập / đăng ký */}
        <div className="mt-4 pt-3 border-t border-zinc-100 text-center">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-xs text-zinc-600 hover:text-zinc-900 hover:underline transition-colors"
          >
            {!isRegister ? 'Chưa có tài khoản? Đăng ký nhân sự' : '← Đã có tài khoản? Quay lại đăng nhập'}
          </button>
        </div>

        {/* Tài khoản kiểm thử nhanh (shadcn Outline Buttons) */}
        {!isRegister && (
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <div className="text-[11px] font-medium text-zinc-400 mb-2">
              Tài khoản mẫu (1-Click Test):
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="h-8 px-2.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center justify-between shadow-sm transition-colors"
              >
                <span className="font-semibold text-zinc-900">Admin</span>
                <span className="text-[10px] text-zinc-400">Giám đốc</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('quanly', '123456')}
                className="h-8 px-2.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center justify-between shadow-sm transition-colors"
              >
                <span className="font-semibold text-zinc-900">Quản đốc</span>
                <span className="text-[10px] text-zinc-400">Sản xuất</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('thukho', '123456')}
                className="h-8 px-2.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center justify-between shadow-sm transition-colors"
              >
                <span className="font-semibold text-zinc-900">Thủ kho</span>
                <span className="text-[10px] text-zinc-400">Vật tư</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ketoan', '123456')}
                className="h-8 px-2.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center justify-between shadow-sm transition-colors"
              >
                <span className="font-semibold text-zinc-900">Kế toán</span>
                <span className="text-[10px] text-zinc-400">Chi phí</span>
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="mt-6 text-center text-xs text-zinc-400">
        HT softtech Manufacturing ERP • Phiên bản 1.2
      </div>
    </div>
  );
}
