import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';

export default function PermissionMatrixView() {
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Danh sách các quyền phân hệ
  const permissionDefinitions = [
    { key: 'dashboard', label: '00. Tổng quan điều hành (Dashboard)', group: 'Tổng quan' },
    { key: 'catalog', label: '01. Danh mục & Hàng hóa, Đối tác, Kho', group: 'Danh mục' },
    { key: 'inventory_view', label: '02. Xem tồn kho & Thẻ kho theo lô', group: 'Kho hàng' },
    { key: 'inventory_manage', label: '02. Lập & Ghi sổ chứng từ kho', group: 'Kho hàng' },
    { key: 'boms', label: '03. Quản lý BOM & Tính nhu cầu (MRP)', group: 'Kỹ thuật & BOM' },
    { key: 'production_view', label: '04. Xem tiến độ Lệnh sản xuất', group: 'Sản xuất' },
    { key: 'production_manage', label: '04. Cấp phát NVL & Báo cáo hoàn thành', group: 'Sản xuất' },
    { key: 'orders', label: '05. Quản lý Mua hàng & Bán hàng', group: 'Kinh doanh' },
    { key: 'finance', label: '06. Thu chi & Sổ quỹ & Công nợ', group: 'Tài chính' },
    { key: 'costings', label: '07. Chi phí & Quyết toán giá thành', group: 'Giá thành' },
    { key: 'role_matrix', label: 'Phân quyền & Cấu hình bảo mật', group: 'Hệ thống' }
  ];

  // Danh sách vai trò hiển thị
  const roleList = [
    { code: 'ADMIN', name: 'Quản trị viên (Chủ xưởng)', badge: 'bg-red-100 text-red-800' },
    { code: 'MANAGER', name: 'Quản đốc phân xưởng', badge: 'bg-purple-100 text-purple-800' },
    { code: 'WAREHOUSE', name: 'Thủ kho chính', badge: 'bg-blue-100 text-blue-800' },
    { code: 'PRODUCTION', name: 'Tổ trưởng sản xuất', badge: 'bg-amber-100 text-amber-800' },
    { code: 'ACCOUNTANT', name: 'Kế toán nội bộ', badge: 'bg-emerald-100 text-emerald-800' }
  ];

  const loadMatrix = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/auth/permissions');
      setMatrix(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const handleToggle = (role, permKey) => {
    if (role === 'ADMIN' && permKey === 'role_matrix') return; // Admin luôn giữ quyền phân quyền
    setMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permKey]: !prev[role]?.[permKey]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetchApi('/auth/permissions', {
        method: 'PUT',
        body: JSON.stringify(matrix)
      });
      alert('Đã cập nhật và lưu ma trận phân quyền thành công vào MySQL!');
    } catch (err) {
      alert(`Lỗi lưu ma trận phân quyền: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !matrix) {
    return <div className="p-8 text-center text-slate-500 text-sm">Đang tải ma trận phân quyền...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ma trận phân quyền (Role-Based Access Control)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập quyền xem và thao tác trên 8 module nghiệp vụ cho các vai trò trong xưởng sản xuất
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadMatrix}
            className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded font-medium hover:bg-slate-50 text-sm shadow-sm"
          >
            Tải lại
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-700 text-white rounded font-medium hover:bg-blue-800 text-sm shadow-sm disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu ma trận phân quyền'}
          </button>
        </div>
      </div>

      {/* Bảng ma trận phân quyền 2 chiều */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-xs uppercase font-bold">
              <th className="p-3.5 w-80">Phân hệ & Quyền chức năng</th>
              {roleList.map(r => (
                <th key={r.code} className="p-3 text-center border-l border-slate-200 min-w-36">
                  <div>{r.name}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold mt-1 inline-block ${r.badge}`}>
                    {r.code}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissionDefinitions.map((perm) => (
              <tr key={perm.key} className="hover:bg-slate-50">
                <td className="p-3 text-slate-800 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">[{perm.group}]</span>
                    <span>{perm.label}</span>
                  </div>
                </td>
                {roleList.map(r => {
                  const isChecked = !!matrix[r.code]?.[perm.key];
                  const isAdminLocked = r.code === 'ADMIN' && perm.key === 'role_matrix';
                  return (
                    <td key={r.code} className="p-3 text-center border-l border-slate-100">
                      <input
                        type="checkbox"
                        disabled={isAdminLocked}
                        checked={isChecked}
                        onChange={() => handleToggle(r.code, perm.key)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chú thích hướng dẫn */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-xs text-blue-800 space-y-1">
        <div className="font-bold uppercase tracking-wide">Quy tắc áp dụng phân quyền:</div>
        <p>• Khi người dùng đăng nhập, hệ thống sẽ tự động đối chiếu vai trò của họ với ma trận trên để bật/tắt các thanh menu và chức năng tương ứng.</p>
        <p>• <strong>Thủ kho</strong> tập trung vào kiểm soát Nhập / Xuất / Chuyển kho / Quản lý số lô, ẩn các chỉ số nhạy cảm về giá thành và doanh thu tài chính.</p>
        <p>• <strong>Tổ trưởng sản xuất</strong> theo dõi Lệnh sản xuất, tiến độ công đoạn gia công và báo cáo sản lượng đạt/lỗi.</p>
        <p>• <strong>Kế toán</strong> phụ trách Mua bán, Thu chi tiền tệ, Theo dõi công nợ và Quyết toán giá thành thành phẩm.</p>
      </div>
    </div>
  );
}
