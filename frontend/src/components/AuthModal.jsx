import React, { useState } from 'react';
import { fetchApi } from '../api';

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.message);
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
      alert('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');
      localStorage.setItem('erp_user', JSON.stringify(res.user));
      localStorage.setItem('erp_permissions', JSON.stringify(res.permissions));
      onLoginSuccess(res.user, res.permissions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Nút đăng nhập nhanh cho các vai trò mẫu
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
      setError(err.message);
    }).finally(() => {
      setLoading(false);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Brand Banner */}
        <div className="bg-slate-950 p-6 text-white text-center border-b border-slate-800">
          <div className="inline-block px-3 py-1 bg-blue-700 text-blue-100 rounded text-xs font-mono font-bold uppercase tracking-wider mb-2">
            Mini Manufacturing ERP V1.0
          </div>
          <h2 className="text-xl font-bold tracking-tight">Hệ thống Quản lý Sản xuất & Kho</h2>
          <p className="text-xs text-slate-400 mt-1">Xưởng Cơ Khí Chế Tạo HT softtech</p>
        </div>

        {/* Tab switch Đăng nhập / Đăng ký */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              !isRegister ? 'border-blue-700 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng nhập tài khoản
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              isRegister ? 'border-blue-700 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng ký nhân sự mới
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-medium">
              {error}
            </div>
          )}

          {!isRegister ? (
            /* Form Đăng nhập */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  required
                  placeholder="admin, thukho, quanly..."
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded p-2.5 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded p-2.5 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-700 text-white font-semibold rounded text-sm hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50 mt-2"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
              </button>
            </form>
          ) : (
            /* Form Đăng ký */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên nhân sự (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn A"
                  value={regData.full_name}
                  onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="nguyenvana"
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu (*)</label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò xưởng (*)</label>
                  <select
                    value={regData.role}
                    onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none"
                  >
                    <option value="WAREHOUSE">Thủ kho</option>
                    <option value="PRODUCTION">Tổ trưởng SX</option>
                    <option value="ACCOUNTANT">Kế toán nội bộ</option>
                    <option value="MANAGER">Quản đốc phân xưởng</option>
                    <option value="ADMIN">Quản trị viên (Chủ xưởng)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="09xx..."
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-700 text-white font-semibold rounded text-sm hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50 mt-2"
              >
                {loading ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
              </button>
            </form>
          )}

          {/* Quick Login Presets tiện lợi */}
          {!isRegister && (
            <div className="pt-3 border-t border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Đăng nhập nhanh tài khoản mẫu để test quyền:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded font-medium text-slate-700 text-left border border-slate-200"
                >
                  👑 Chủ xưởng (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('thukho', '123456')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded font-medium text-slate-700 text-left border border-slate-200"
                >
                  📦 Thủ kho (thukho)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('quanly', '123456')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded font-medium text-slate-700 text-left border border-slate-200"
                >
                  🏭 Quản đốc (quanly)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('ketoan', '123456')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded font-medium text-slate-700 text-left border border-slate-200"
                >
                  💰 Kế toán (ketoan)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
