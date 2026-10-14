'use client';

import React, { useState } from 'react';
import { fetchApi } from '../api';

export default function LoginView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans antialiased bg-[#faf8f5]">
      {/* ======================================================== */}
      {/* KHỐI TRÁI: GIAO DIỆN QUẢNG BÁ THƯƠNG HIỆU DOANH NGHIỆP   */}
      {/* ======================================================== */}
      <div className="relative w-full lg:w-[58%] xl:w-[60%] bg-[#12110e] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden flex-shrink-0">
        {/* Ánh sáng nền trang trí tinh tế */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* 1. Header Logo & Tên Thương Hiệu */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg shadow-amber-500/20 flex-shrink-0">
            <svg className="w-6 h-6 text-zinc-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base tracking-[0.15em] text-amber-400 uppercase">
              TIẾN PHÁT WOOD & FURNITURE
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              CHẾ TÁC & SẢN XUẤT NỘI THẤT GỖ TINH XẢO • ERP
            </div>
          </div>
        </div>

        {/* 2. Khối Nội dung Tiêu Đề Trung Tâm */}
        <div className="my-auto py-10 lg:py-12 z-10 space-y-6 max-w-xl">
          {/* Badge hệ thống */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-amber-300/90 shadow-2xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            HỆ THỐNG ĐIỀU HÀNH ERP XƯỞNG GỖ TOÀN DIỆN
          </div>

          {/* Tiêu đề lớn */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.18]">
            Quản Trị Chuỗi Sản Xuất & Chế Tác Gỗ Nội Thất
          </h1>

          {/* Mô tả giải pháp */}
          <p className="text-sm sm:text-base text-zinc-300/90 leading-relaxed font-normal">
            Hệ thống điều hành số hóa toàn diện: từ bóc tách định mức kỹ thuật BOM, hoạch định vật tư MRP, kiểm soát tiến độ công đoạn mộc - buồng sơn PU đến truy vết số lô và quyết toán giá thành.
          </p>

          {/* 4 Mục điểm nổi bật (Grid 2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs sm:text-sm font-medium text-zinc-200">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span>Bóc tách BOM & Hao hụt gỗ</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span>Kế hoạch vật tư & Cấp phát</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span>Tiến độ công đoạn & QR số lô</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span>Quyết toán giá thành & Sổ kho TT133</span>
            </div>
          </div>

          {/* Khung Triết lý & Sứ mệnh hoạt động (Chuẩn Ảnh 2) */}
          <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-amber-500/20 backdrop-blur-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 font-serif text-2xl font-bold select-none">
              “
            </div>
            <div className="space-y-1">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-400">
                TRIẾT LÝ & SỨ MỆNH HOẠT ĐỘNG
              </div>
              <p className="text-sm sm:text-base italic text-zinc-200 font-light leading-relaxed">
                “Để được <strong className="font-bold text-amber-300 not-italic">THÀNH CÔNG</strong> trong <strong className="font-bold text-amber-300 not-italic">HẠNH PHÚC</strong> chỉ 1 con đường duy nhất đó là tạo ra <strong className="font-bold text-amber-300 not-italic">GIÁ TRỊ</strong>”
              </p>
            </div>
          </div>
        </div>

        {/* 3. Footer bên trái */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-6 border-t border-white/5 z-10 flex-wrap gap-2">
          <span>© 2026 Tien Phat Furniture JSC. Enterprise ERP Platform.</span>
          <span className="font-mono text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/10 text-[11px]">
            MES v2.6
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* KHỐI PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ PHONG CÁCH HIỆN ĐẠI  */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[42%] xl:w-[40%] flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-zinc-950/5 border border-zinc-200/80 p-8 sm:p-10 transition-all">
          {/* Header Form */}
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
              Chào mừng trở lại
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              {!isRegister ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {!isRegister
                ? 'Sử dụng email công việc hoặc mã nhân viên được cấp.'
                : 'Khởi tạo tài khoản phân quyền làm việc nội bộ.'}
            </p>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
              <svg className="w-4 h-4 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!isRegister ? (
            /* FORM ĐĂNG NHẬP */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">
                  Email hoặc mã nhân viên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    placeholder="admin, thukho, quanly..."
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-3 text-xs sm:text-sm shadow-2xs transition-colors placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-10 text-xs sm:text-sm shadow-2xs transition-colors placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[#1c1917] hover:bg-[#2c2825] active:bg-[#121110] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
                {!loading && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </form>
          ) : (
            /* FORM ĐĂNG KÝ */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                  Họ và tên nhân sự (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={regData.full_name}
                  onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 text-xs shadow-2xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                    Username (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 text-xs shadow-2xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                    Mật khẩu (*)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 text-xs shadow-2xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                  Vai trò bộ phận (*)
                </label>
                <select
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
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
                className="h-11 w-full rounded-xl bg-[#1c1917] hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold shadow-md transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? 'Đang khởi tạo...' : 'Tạo tài khoản'}
              </button>
            </form>
          )}

          {/* Mục: Tài khoản thử nghiệm (1 - Click Demo) Accordion - Chuẩn Ảnh 2 */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full flex items-center justify-between text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors py-1 group"
              >
                <div className="flex items-center gap-1.5 text-amber-800">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Tài khoản thử nghiệm (1 - Click Demo)</span>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-transform duration-200 ${
                    showDemoAccounts ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDemoAccounts && (
                <div className="grid grid-cols-2 gap-2 mt-3 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'admin123')}
                    className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all shadow-2xs group"
                  >
                    <div className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">Admin</div>
                    <div className="text-[10px] text-zinc-500">Giám đốc xưởng</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('quanly', '123456')}
                    className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all shadow-2xs group"
                  >
                    <div className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">Quản đốc</div>
                    <div className="text-[10px] text-zinc-500">Tổ trưởng SX</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('thukho', '123456')}
                    className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all shadow-2xs group"
                  >
                    <div className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">Thủ kho</div>
                    <div className="text-[10px] text-zinc-500">NVL, BTP, TP</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ketoan', '123456')}
                    className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all shadow-2xs group"
                  >
                    <div className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">Kế toán</div>
                    <div className="text-[10px] text-zinc-500">Giá thành & Quỹ</div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chuyển đổi đăng ký / đăng nhập */}
          <div className="mt-5 pt-3 border-t border-zinc-100 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-medium transition-colors"
            >
              {!isRegister ? 'Chưa có tài khoản? Đăng ký nhân sự' : '← Đã có tài khoản? Quay lại đăng nhập'}
            </button>
          </div>

          {/* Chú thích chân trang */}
          <div className="mt-4 text-center text-[11px] text-zinc-400">
            Liên hệ HR hoặc quản trị viên nếu bạn không thể truy cập.
          </div>
        </div>
      </div>
    </div>
  );
}
