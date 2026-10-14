'use client';

import React, { useState } from 'react';

export default function UserProfileModal({ currentUser, onClose, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('profile'); // profile | security | permissions
  const [fullName, setFullName] = useState(currentUser?.full_name || 'Nguyễn Văn Quản Trị');
  const [email, setEmail] = useState(currentUser?.email || 'admin@htsofttech.com');
  const [phone, setPhone] = useState(currentUser?.phone || '0988 123 456');
  const [department, setDepartment] = useState(currentUser?.department || 'Ban Điều Hành Xưởng Gỗ');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });
  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      full_name: fullName,
      email,
      phone,
      department
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setSaveMsg('Cập nhật hồ sơ tài khoản thành công!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setPwdMsg({ text: 'Vui lòng nhập mật khẩu hiện tại.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg({ text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'Xác nhận mật khẩu mới không khớp!', type: 'error' });
      return;
    }
    // Success simulation
    setPwdMsg({ text: 'Đổi mật khẩu tài khoản thành công!', type: 'success' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwdMsg({ text: '', type: '' }), 4000);
  };

  const permissionsList = [
    { name: 'Tổng quan Dashboard', desc: 'Xem thống kê sản xuất, tồn kho, doanh số & biểu đồ KPIs', enabled: true },
    { name: 'Danh mục Vật tư & Đối tác', desc: 'Thêm, sửa, xem thông tin NVL, BTP, Thành phẩm, Kho và Nhà cung cấp', enabled: true },
    { name: 'Định mức Kỹ thuật (BOM)', desc: 'Xây dựng định mức vật tư, cấu trúc cây BOM & hao hụt', enabled: true },
    { name: 'Mua hàng (PO) & Bán hàng (SO)', desc: 'Lập đơn mua, duyệt đơn, lập báo giá & đơn bán thành phẩm', enabled: true },
    { name: 'Sổ kho & Quản lý Số Lô', desc: 'Quản lý xuất nhập tồn, truy vết nguồn gốc số lô (Lot Tracing)', enabled: true },
    { name: 'Điều độ Lệnh sản xuất (LSX)', desc: 'Phát hành lệnh, cấp phát vật tư tự động, ghi nhận công đoạn & nhập kho TP', enabled: true },
    { name: 'Tài chính & Sổ quỹ nội bộ', desc: 'Lập phiếu thu, phiếu chi, theo dõi dòng tiền & công nợ', enabled: true },
    { name: 'Giá thành thực tế & Quyết toán', desc: 'Tập hợp chi phí NVL thực tế, nhân công, máy móc và phân tích chênh lệch BOM', enabled: true },
    { name: 'Quản trị Phân quyền RBAC', desc: 'Quản lý người dùng, nhóm quyền & phân bổ ma trận chức năng', enabled: currentUser?.role === 'ADMIN' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-2xl overflow-hidden flex flex-col h-[580px] max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-base text-zinc-100 shadow-inner">
              {currentUser?.username ? currentUser.username[0].toUpperCase() : 'A'}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Thông tin Tài khoản & Hồ sơ cá nhân
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {currentUser?.role || 'ADMIN'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                @{currentUser?.username || 'admin'} • {department}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 gap-2 pt-2 text-xs font-medium flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Hồ sơ người dùng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Đổi mật khẩu & Bảo mật
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Quyền hạn kích hoạt ({permissionsList.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: PROFILE INFO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {saveMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {saveMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Tên đăng nhập (Username)</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.username || 'admin'}
                    className="w-full bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-md px-3 py-2 cursor-not-allowed font-mono text-xs"
                  />
                  <span className="text-[10px] text-zinc-400">Tên định danh cố định trong hệ thống</span>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Vai trò hệ thống</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.role === 'ADMIN' ? 'Quản trị tối cao (Super Admin)' : currentUser?.role || 'Nhân viên'}
                    className="w-full bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium rounded-md px-3 py-2 cursor-not-allowed text-xs"
                  />
                  <span className="text-[10px] text-zinc-400">Được cấp theo cấu hình ma trận RBAC</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Họ và tên hiển thị *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-zinc-900 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-zinc-900 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Số điện thoại di động</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-zinc-900 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Phòng ban / Xưởng trực thuộc</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-zinc-900 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md mx-auto">
              {pwdMsg.text && (
                <div
                  className={`p-3 rounded-lg font-medium text-xs flex items-center gap-2 ${
                    pwdMsg.type === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {pwdMsg.type === 'error' ? (
                    <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {pwdMsg.text}
                </div>
              )}

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu đang dùng"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-zinc-900 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-zinc-900 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-zinc-900 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Đổi mật khẩu bảo vệ
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-900">Vai trò đăng nhập: {currentUser?.role || 'ADMIN'}</div>
                  <div className="text-[11px] text-zinc-500">Tài khoản này được cấp quyền truy cập toàn diện trên hệ thống quản lý xưởng gỗ.</div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-zinc-200 text-zinc-800 border border-zinc-300">
                  Toàn quyền
                </span>
              </div>

              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
                {permissionsList.map((perm, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div>
                      <div className="font-semibold text-zinc-900">{perm.name}</div>
                      <div className="text-[11px] text-zinc-500">{perm.desc}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                      Đã kích hoạt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-zinc-500">
            Hệ thống ERP Xưởng Gỗ HT softtech • v2.4
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-md font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
