import React, { useState } from 'react';
import { fetchApi } from '../api';

export default function LoginView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branch, setBranch] = useState('factory_hn');
  const [rememberMe, setRememberMe] = useState(true);

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
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-between font-sans antialiased text-slate-800">
      {/* Top Banner Tiêu chuẩn Doanh nghiệp */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs tracking-wider">
            ERP
          </div>
          <div className="text-white font-semibold text-sm tracking-wide">
            VINATECH MANUFACTURING ERP
          </div>
          <span className="text-slate-500 text-xs hidden sm:inline">|</span>
          <span className="text-slate-400 text-xs hidden sm:inline">Hệ thống điều hành sản xuất & kho xưởng</span>
        </div>
        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Hệ thống nội bộ</span>
        </div>
      </header>

      {/* Khối Đăng nhập Trung tâm Chuẩn ERP (Không vẽ vời, Không AI) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-slate-300 rounded-lg shadow-sm">
          {/* Header Card */}
          <div className="px-6 py-5 border-b border-slate-200">
            <h1 className="text-lg font-bold text-slate-900">
              {!isRegister ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản nhân viên'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {!isRegister
                ? 'Nhập mã định danh nhân sự để truy cập phần mềm'
                : 'Khởi tạo tài khoản phân quyền làm việc mới'}
            </p>
          </div>

          <div className="p-6">
            {/* Thông báo lỗi */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                <strong>Lỗi:</strong> {error}
              </div>
            )}

            {!isRegister ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Chọn Chi nhánh / Phân xưởng */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chi nhánh / Nhà máy
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:border-blue-600 focus:bg-white focus:outline-none"
                  >
                    <option value="factory_hn">Nhà máy Cơ khí VinaTech (Hà Nội)</option>
                    <option value="warehouse_central">Kho Tổng Vật tư & Bán thành phẩm</option>
                  </select>
                </div>

                {/* Tên đăng nhập */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đăng nhập / Mã nhân viên
                  </label>
                  <input
                    type="text"
                    required
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    placeholder="VD: admin, thukho, quanly..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Mật khẩu */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Ghi nhớ & Quên mật khẩu */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Vui lòng liên hệ Trưởng phòng CNTT hoặc Ban Giám Đốc để cấp lại mật khẩu.')}
                    className="text-blue-700 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Nút Đăng nhập */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}
                </button>
              </form>
            ) : (
              /* FORM ĐĂNG KÝ */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên nhân sự (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={regData.full_name}
                    onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username (*)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="username"
                      value={regData.username}
                      onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mật khẩu (*)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••"
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bộ phận / Vai trò (*)
                  </label>
                  <select
                    value={regData.role}
                    onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="WAREHOUSE">Bộ phận Kho (Thủ kho)</option>
                    <option value="PRODUCTION">Bộ phận Sản xuất (Tổ trưởng / Điều độ)</option>
                    <option value="ACCOUNTANT">Phòng Kế toán (Chi phí & Sổ quỹ)</option>
                    <option value="MANAGER">Quản đốc phân xưởng</option>
                    <option value="ADMIN">Ban Giám Đốc / Quản trị hệ thống</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50 mt-2"
                >
                  {loading ? 'Đang xử lý...' : 'XÁC NHẬN TẠO TÀI KHOẢN'}
                </button>
              </form>
            )}

            {/* Chuyển đổi Đăng nhập / Đăng ký */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-xs text-blue-700 hover:underline font-medium"
              >
                {!isRegister
                  ? 'Chưa có tài khoản? Đăng ký nhân sự mới'
                  : '← Đã có tài khoản? Quay lại màn hình đăng nhập'}
              </button>
            </div>

            {/* Bảng phân quyền nhanh phục vụ kiểm thử (gọn gàng, chuẩn form nội bộ) */}
            {!isRegister && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Tài khoản kiểm thử nhanh (1-Click):
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'admin123')}
                    className="p-2 border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800">Admin</div>
                    <div className="text-[10px] text-slate-500">Giám đốc (Toàn quyền)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('quanly', '123456')}
                    className="p-2 border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800">Quản đốc</div>
                    <div className="text-[10px] text-slate-500">Kế hoạch & Sản xuất</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('thukho', '123456')}
                    className="p-2 border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800">Thủ kho</div>
                    <div className="text-[10px] text-slate-500">NVL, BTP & Số lô</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ketoan', '123456')}
                    className="p-2 border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded text-left transition-colors"
                  >
                    <div className="font-semibold text-slate-800">Kế toán</div>
                    <div className="text-[10px] text-slate-500">Giá thành & Sổ quỹ</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Bản quyền & Bảo mật Doanh nghiệp */}
      <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-500">
        <div>
          <span>Bản quyền © 2026 VinaTech Factory. Phiên bản hệ thống v1.2</span>
        </div>
        <div className="hidden sm:block">
          <span>Hệ thống chỉ dành cho nhân sự được phân quyền</span>
        </div>
      </footer>
    </div>
  );
}
