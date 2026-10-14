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
    <div className="h-screen w-full flex flex-col lg:flex-row font-sans antialiased bg-[#faf8f5] overflow-y-auto lg:overflow-hidden select-none">
      {/* ======================================================== */}
      {/* KHỐI TRÁI: CONCEPT ĐIỀU HÀNH SẢN XUẤT XƯỞNG GỖ NỘI THẤT */}
      {/* ======================================================== */}
      <div className="relative w-full lg:w-[56%] xl:w-[58%] bg-[#14120e] text-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 overflow-hidden flex-shrink-0">
        {/* Ánh sáng ấm sắc gỗ tự nhiên */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-700/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Vân họa tiết kỹ thuật chế tác mộc */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* 1. Header Logo Xưởng Gỗ */}
        <div className="flex items-center gap-3 z-10 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-amber-900/40 flex-shrink-0 border border-amber-400/30">
            {/* Icon Thớ Gỗ / Nhà Xưởng */}
            <svg className="w-5 h-5 text-zinc-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16M4 20V9l8-5 8 5v11M9 20v-6h6v6"/>
            </svg>
          </div>
          <div>
            <div className="font-black text-sm tracking-[0.16em] text-amber-400 uppercase">
              TIẾN PHÁT WOOD MANUFACTURING
            </div>
            <div className="text-[10px] font-medium tracking-[0.18em] text-zinc-400 uppercase">
              HỆ THỐNG QUẢN TRỊ SẢN XUẤT XƯỞNG MỘC & NỘI THẤT
            </div>
          </div>
        </div>

        {/* 2. Khối Nội dung Tiêu Đề Trung Tâm Chuẩn Nghiệp Vụ Xưởng Gỗ */}
        <div className="my-auto py-6 sm:py-8 z-10 space-y-4 max-w-lg xl:max-w-xl">
          {/* Badge hệ thống */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            GIẢI PHÁP SỐ HÓA NHÀ MÁY & PHÂN XƯỞNG GỖ NỘI THẤT
          </div>

          {/* Tiêu đề chính */}
          <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black tracking-tight text-white leading-[1.22]">
            Quản Trị Chuỗi Sản Xuất & Điều Độ Xưởng Mộc
          </h1>

          {/* Mô tả nghiệp vụ thực tế ngành gỗ */}
          <p className="text-xs sm:text-sm text-zinc-300/80 leading-relaxed font-normal">
            Nền tảng kiểm soát chuyên sâu cho ngành chế biến gỗ: từ bóc tách định mức vật tư BOM, hoạch định gỗ khối & ván MDF, theo dõi tiến độ gia công CNC - buồng sơn PU đến dán nhãn QR số lô xuất xưởng.
          </p>

          {/* 4 Trụ Cột Nghiệp Vụ Cốt Lõi Ngành Gỗ (Grid 2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium text-zinc-200">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                <span>Định mức BOM & Hao hụt gỗ</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal leading-normal">
                Tính toán khối lượng m3 gỗ tự nhiên, tấm ván MDF và tỷ lệ hao hụt phôi cắt.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                <span>Điều độ công đoạn mộc & Sơn PU</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal leading-normal">
                Kiểm soát tiến độ xẻ nan, dán cạnh, ráp khung thô, chà nhám và phun sơn.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                <span>Quản lý 3 kho & In tem QR lô</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal leading-normal">
                Tách biệt Kho NVL, Kho BTP mộc thô, Kho Thành phẩm và truy vết phả hệ lô.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Giá thành thực tế & Sổ kho TT133</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal leading-normal">
                Tập hợp chi phí gỗ, phụ kiện ray bản lề, keo sơn, nhân công và in phiếu chuẩn.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Footer bên trái */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-white/5 z-10 flex-wrap gap-2 flex-shrink-0">
          <span>© 2026 Tiến Phát Wood Manufacturing JSC. Enterprise ERP Platform.</span>
          <span className="font-mono text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/10 text-[10px]">
            WOOD-MES v2.6
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* KHỐI PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ PHONG CÁCH HIỆN ĐẠI  */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[44%] xl:w-[42%] flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10 flex-shrink-0">
        <div className="w-full max-w-[390px] xl:max-w-[420px] bg-white rounded-2xl shadow-xl shadow-zinc-950/5 border border-zinc-200/80 p-6 sm:p-7 transition-all">
          {/* Header Form */}
          <div className="mb-4">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">
              Cổng nhân sự phân xưởng
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              {!isRegister ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản'}
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">
              {!isRegister
                ? 'Sử dụng tài khoản hoặc mã nhân viên phân xưởng được cấp.'
                : 'Khởi tạo tài khoản phân quyền làm việc nội bộ.'}
            </p>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!isRegister ? (
            /* FORM ĐĂNG NHẬP */
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                  Tài khoản / Mã nhân sự
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
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
                    className="h-9.5 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-9 pr-3 text-xs sm:text-sm shadow-2xs transition-colors placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
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
                    className="h-9.5 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-9 pr-9 text-xs sm:text-sm shadow-2xs transition-colors placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
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
                className="h-10 w-full rounded-xl bg-[#1c1917] hover:bg-[#2c2825] active:bg-[#121110] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
                {!loading && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </form>
          ) : (
            /* FORM ĐĂNG KÝ */
            <form onSubmit={handleRegister} className="space-y-2.5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-0.5 block">
                  Họ và tên nhân sự (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={regData.full_name}
                  onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 text-xs shadow-2xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-0.5 block">
                    Username (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 text-xs shadow-2xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-0.5 block">
                    Mật khẩu (*)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 text-xs shadow-2xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-0.5 block">
                  Vai trò bộ phận (*)
                </label>
                <select
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
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
                className="h-9.5 w-full rounded-xl bg-[#1c1917] hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold shadow transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? 'Đang khởi tạo...' : 'Tạo tài khoản'}
              </button>
            </form>
          )}

          {/* Mục: Tài khoản thử nghiệm (1 - Click Demo) - Gọn gàng chuyên nghiệp */}
          {!isRegister && (
            <div className="mt-4 pt-3.5 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full flex items-center justify-between text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors py-0.5 group"
              >
                <div className="flex items-center gap-1.5 text-amber-800">
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="grid grid-cols-2 gap-1.5 mt-2 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'admin123')}
                    className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all shadow-2xs group flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">Admin</div>
                      <div className="text-[10px] text-zinc-400">Giám đốc xưởng</div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('quanly', '123456')}
                    className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all shadow-2xs group flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">Quản đốc</div>
                      <div className="text-[10px] text-zinc-400">Tổ trưởng SX mộc</div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('thukho', '123456')}
                    className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all shadow-2xs group flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">Thủ kho</div>
                      <div className="text-[10px] text-zinc-400">Gỗ, Phụ kiện, Sơn</div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ketoan', '123456')}
                    className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all shadow-2xs group flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-zinc-900 group-hover:text-amber-900">Kế toán</div>
                      <div className="text-[10px] text-zinc-400">Giá thành & Sổ quỹ</div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">→</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chuyển đổi đăng ký / đăng nhập */}
          <div className="mt-3.5 pt-2.5 border-t border-zinc-100 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-medium transition-colors"
            >
              {!isRegister ? 'Chưa có tài khoản? Đăng ký nhân sự' : '← Đã có tài khoản? Quay lại đăng nhập'}
            </button>
          </div>

          {/* Chú thích chân trang */}
          <div className="mt-2 text-center text-[10px] text-zinc-400">
            Hệ thống quản trị nội bộ phân xưởng gỗ • QL Xưởng Gỗ v2.6
          </div>
        </div>
      </div>
    </div>
  );
}
