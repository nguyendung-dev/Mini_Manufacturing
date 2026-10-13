import React, { useState, useEffect } from 'react';
import { fetchApi, formatMoney, formatNumber } from '../api';
import { exportToExcel } from '../utils/excel';

export default function ProductionView({ onOpenTraceModal, targetOrderId }) {
  const [orders, setOrders] = useState([]);
  const [boms, setBoms] = useState([]);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  useEffect(() => {
    if (targetOrderId && orders.length > 0) {
      const match = orders.find(o => String(o.id) === String(targetOrderId) || o.code === targetOrderId);
      if (match) {
        setSelectedOrder(match);
      }
    }
  }, [targetOrderId, orders]);

  // Form tạo LSX mới
  const [orderForm, setOrderForm] = useState({
    code: '',
    date: new Date().toISOString().split('T')[0],
    target_item_id: '',
    bom_id: '',
    planned_qty: 10,
    lot_number: '',
    notes: ''
  });

  // Form hoàn thành LSX
  const [finishForm, setFinishForm] = useState({
    actualQty: 10,
    defectiveQty: 0,
    note: ''
  });

  const loadData = async () => {
    try {
      const q = statusFilter ? `?status=${statusFilter}` : '';
      const ords = await fetchApi(`/production/orders${q}`);
      setOrders(ords);
      if (ords.length > 0 && !selectedOrder) {
        setSelectedOrder(ords[0]);
      } else if (selectedOrder) {
        const updated = ords.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }

      const bList = await fetchApi('/boms');
      setBoms(bList);

      const itms = await fetchApi('/catalog/items');
      setItems(itms);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/production/orders', {
        method: 'POST',
        body: JSON.stringify(orderForm)
      });
      alert('Tạo Lệnh sản xuất thành công!');
      setShowCreateModal(false);
      setOrderForm({
        code: '',
        date: new Date().toISOString().split('T')[0],
        target_item_id: '',
        bom_id: '',
        planned_qty: 10,
        lot_number: '',
        notes: ''
      });
      loadData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy / xóa Lệnh sản xuất "${order.code}"?`)) return;
    try {
      await fetchApi(`/production/orders/${order.id}`, { method: 'DELETE' });
      if (selectedOrder?.id === order.id) setSelectedOrder(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAllocateMaterials = async () => {
    if (!selectedOrder) return;
    if (!window.confirm(`Xác nhận cấp phát nguyên vật liệu từ Kho NVL sang Xưởng sản xuất cho lệnh [${selectedOrder.code}]?`)) return;

    try {
      const allocations = (selectedOrder.materialAllocations || []).map(a => ({
        itemId: a.item_id,
        lotNumber: a.lot_number || 'LOT-AUTO',
        qty: Number(a.planned_qty) - Number(a.allocated_qty || 0)
      })).filter(a => a.qty > 0);

      if (allocations.length === 0) {
        alert('Tất cả vật tư theo định mức của lệnh này đã được cấp phát đủ.');
        return;
      }

      const res = await fetchApi(`/production/orders/${selectedOrder.id}/allocate`, {
        method: 'POST',
        body: JSON.stringify({
          sourceWarehouseId: 'WH-NVL',
          destWarehouseId: 'WH-SX',
          allocations
        })
      });

      alert(`Cấp phát thành công! Sinh phiếu kho: ${res.txCode}`);
      loadData();
    } catch (err) {
      alert(`Lỗi cấp phát: ${err.message}`);
    }
  };

  const handleFinishOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetchApi(`/production/orders/${selectedOrder.id}/finish`, {
        method: 'POST',
        body: JSON.stringify({
          actualQty: finishForm.actualQty,
          defectiveQty: finishForm.defectiveQty,
          note: finishForm.note
        })
      });

      alert(`Hoàn thành lệnh sản xuất! Đã nhập kho sản phẩm theo phiếu: ${res.txCode}`);
      setShowFinishModal(false);
      loadData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleUpdateStage = async (stageId, status, qty) => {
    try {
      await fetchApi(`/production/orders/${selectedOrder.id}/stages/${stageId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, completed_qty: qty })
      });
      loadData();
    } catch (err) {
      alert(`Lỗi cập nhật công đoạn: ${err.message}`);
    }
  };

  const handleExportOrdersExcel = () => {
    const exportData = orders.map((o, idx) => ({
      'STT': idx + 1,
      'Số Lệnh SX': o.code,
      'Ngày lập': new Date(o.date).toLocaleDateString('vi-VN'),
      'Mã thành phẩm': o.target_item_code,
      'Tên sản phẩm SX': o.target_item_name,
      'Định mức BOM': o.bom_code,
      'Số lô quản lý': o.lot_number,
      'SL Kế hoạch': Number(o.planned_qty),
      'SL Đã đạt': Number(o.actual_qty),
      'SL Phế phẩm': Number(o.defective_qty),
      'ĐVT': o.target_item_unit,
      'Tiến độ (%)': `${o.progressPercent || 0}%`,
      'Trạng thái': o.status === 'COMPLETED' ? 'Hoàn thành' : o.status === 'IN_PROGRESS' ? 'Đang chạy' : 'Bản nháp',
      'Ghi chú': o.notes || '-'
    }));
    exportToExcel(exportData, 'Danh_Sach_Lenh_San_Xuat', 'Lenh_San_Xuat');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lệnh sản xuất & Điều độ phân xưởng</h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi kế hoạch, cấp phát vật tư theo đợt, công đoạn gia công và nhập kho BTP/TP theo lô
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportOrdersExcel}
            className="px-3.5 py-2 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 shadow-sm text-sm flex items-center gap-1.5"
            title="Xuất danh sách Lệnh sản xuất ra Excel (.xlsx)"
          >
            📊 Xuất Excel
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-700 text-white rounded font-medium hover:bg-blue-800 shadow-sm text-sm"
          >
            + Lập Lệnh sản xuất mới
          </button>
        </div>
      </div>

      {/* Lọc trạng thái */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-slate-600">Trạng thái:</span>
        {['', 'DRAFT', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 text-xs font-semibold rounded border ${
              statusFilter === st
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {st === '' ? 'Tất cả' : st === 'DRAFT' ? 'Dự thảo (Nháp)' : st === 'IN_PROGRESS' ? 'Đang sản xuất' : 'Đã hoàn thành'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Danh sách LSX (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Danh sách lệnh sản xuất</h3>
          <div className="space-y-2">
            {orders.map(ord => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  selectedOrder?.id === ord.id
                    ? 'border-blue-700 bg-blue-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-mono text-xs font-bold text-blue-700">{ord.code}</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${
                      ord.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      ord.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ord.status === 'COMPLETED' ? 'bg-emerald-500' : ord.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                      {ord.status === 'COMPLETED' ? 'Hoàn thành' : ord.status === 'IN_PROGRESS' ? 'Đang chạy' : 'Nháp'}
                    </span>
                    {ord.status !== 'COMPLETED' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(ord); }}
                        className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors"
                        title="Hủy / Xóa LSX"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="font-semibold text-slate-800 text-sm mt-1">{ord.target_item_name}</div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>Kế hoạch: <strong>{formatNumber(ord.planned_qty)} {ord.target_item_unit}</strong></span>
                  <span>Đã đạt: <strong className="text-emerald-700">{formatNumber(ord.actual_qty)}</strong></span>
                </div>
                <div className="text-xs text-slate-600 mt-2 flex justify-between border-t border-slate-100 pt-1.5 items-center">
                  <span className="font-mono text-slate-500">Lô: {ord.lot_number}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 bg-slate-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${ord.progressPercent || 0}%` }}></div>
                    </div>
                    <span className="font-semibold text-slate-700">{ord.progressPercent || 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chi tiết lệnh sản xuất được chọn (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedOrder && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-6">
              {/* Top Banner chi tiết lệnh sản xuất */}
              <div className="border-b border-slate-200 pb-4 space-y-3">
                {/* Hàng 1: Mã lệnh, Số lô, Trạng thái & Các nút thao tác */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
                      {selectedOrder.code}
                    </h3>
                    <span className="font-mono text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-semibold whitespace-nowrap">
                      Lô: {selectedOrder.lot_number}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 whitespace-nowrap ${
                      selectedOrder.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      selectedOrder.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedOrder.status === 'COMPLETED' ? 'bg-emerald-500' : selectedOrder.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                      {selectedOrder.status === 'COMPLETED' ? 'Đã hoàn thành' : selectedOrder.status === 'IN_PROGRESS' ? 'Đang sản xuất' : 'Bản nháp'}
                    </span>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedOrder.status !== 'COMPLETED' && (
                      <>
                        <button
                          onClick={handleAllocateMaterials}
                          className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-colors"
                          title="Xuất vật tư từ Kho NVL sang Kho Sản Xuất"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                          Cấp phát vật tư
                        </button>
                        <button
                          onClick={() => {
                            setFinishForm({
                              actualQty: selectedOrder.planned_qty,
                              defectiveQty: 0,
                              note: 'Nhập kho hoàn thành sản xuất'
                            });
                            setShowFinishModal(true);
                          }}
                          className="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 whitespace-nowrap transition-colors"
                          title="Báo cáo hoàn thành và nhập kho thành phẩm"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          Nhập kho hoàn thành
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onOpenTraceModal(selectedOrder.lot_number)}
                      className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-colors"
                      title="Tra cứu phả hệ số lô và nguồn gốc vật tư"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                      Truy vết số lô
                    </button>
                    {selectedOrder.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleDeleteOrder(selectedOrder)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                        title="Hủy / Xóa lệnh sản xuất này"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Hàng 2: Thanh thông tin chi tiết (Sản phẩm, BOM, Ngày lập, Kế hoạch vs Thực đạt) */}
                <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 gap-2">
                  <div className="flex items-center gap-4 flex-wrap text-slate-600">
                    <div>
                      Sản phẩm: <strong className="text-slate-900">{selectedOrder.target_item_name}</strong>
                    </div>
                    <div>
                      Bản vẽ BOM: <strong className="font-mono text-blue-700">{selectedOrder.bom_code}</strong>
                    </div>
                    <div>
                      Ngày lập: <span className="font-medium text-slate-700">{new Date(selectedOrder.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">
                      Kế hoạch: <strong className="text-slate-900">{formatNumber(selectedOrder.planned_qty)} {selectedOrder.target_item_unit}</strong>
                    </span>
                    <span className="text-slate-600">
                      Đã đạt: <strong className="text-emerald-700">{formatNumber(selectedOrder.actual_qty)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tiến độ các công đoạn gia công */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  1. Theo dõi các công đoạn sản xuất
                </h4>
                <div className="space-y-2">
                  {(selectedOrder.stages || []).map((stg) => (
                    <div key={stg.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-500 w-5">#{stg.stage_order}</span>
                        <div>
                          <div className="font-semibold text-slate-800">{stg.name}</div>
                          <div className="text-slate-500">
                            Sản lượng đạt: <strong>{formatNumber(stg.completed_qty)}</strong> / {formatNumber(selectedOrder.planned_qty)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          stg.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          stg.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {stg.status === 'COMPLETED' ? 'Đã xong' : stg.status === 'IN_PROGRESS' ? 'Đang chạy' : 'Chưa chạy'}
                        </span>
                        {selectedOrder.status !== 'COMPLETED' && stg.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateStage(stg.id, 'COMPLETED', selectedOrder.planned_qty)}
                            className="px-2 py-1 bg-white border border-slate-300 hover:bg-blue-50 text-blue-700 rounded font-semibold"
                          >
                            Xác nhận xong
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng cấp phát nguyên vật liệu */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    2. Cấp phát & Tiêu hao vật tư theo đợt
                  </h4>
                  <span className="text-xs text-slate-500">Kho nguồn mặc định: KHO-NVL → KHO-SX</span>
                </div>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-2">Vật tư / BTP</th>
                        <th className="p-2 text-right">Kế hoạch</th>
                        <th className="p-2 text-right">Đã cấp phát</th>
                        <th className="p-2 text-right">Thực dùng</th>
                        <th className="p-2">Số lô cấp</th>
                        <th className="p-2 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedOrder.materialAllocations || []).map((al, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <div className="font-semibold text-slate-800">{al.item_name}</div>
                            <div className="text-slate-400 font-mono">{al.item_code}</div>
                          </td>
                          <td className="p-2 text-right text-slate-700">{formatNumber(al.planned_qty)} {al.item_unit}</td>
                          <td className="p-2 text-right font-bold text-blue-700">{formatNumber(al.allocated_qty)}</td>
                          <td className="p-2 text-right font-bold text-emerald-700">{formatNumber(al.actual_used_qty)}</td>
                          <td className="p-2 font-mono text-slate-600">{al.lot_number || '-'}</td>
                          <td className="p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${
                              al.allocated_qty >= al.planned_qty ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {al.allocated_qty >= al.planned_qty ? 'Đủ' : 'Chưa đủ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Lập Lệnh sản xuất mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
              Lập Lệnh sản xuất mới (LSX)
            </h3>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mã lệnh (Để trống tự sinh)</label>
                  <input
                    type="text"
                    placeholder="LSX-202610-XXX"
                    value={orderForm.code}
                    onChange={(e) => setOrderForm({ ...orderForm, code: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày lập (*)</label>
                  <input
                    type="date"
                    required
                    value={orderForm.date}
                    onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Định mức áp dụng (BOM) (*)</label>
                <select
                  required
                  value={orderForm.bom_id}
                  onChange={(e) => {
                    const selB = boms.find(b => b.id === e.target.value);
                    setOrderForm({
                      ...orderForm,
                      bom_id: e.target.value,
                      target_item_id: selB ? selB.target_item_id : ''
                    });
                  }}
                  className="w-full text-sm border p-2 rounded focus:outline-none"
                >
                  <option value="">-- Chọn BOM định mức --</option>
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>[{b.code}] {b.name} (v{b.version})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số lượng sản xuất (*)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderForm.planned_qty}
                    onChange={(e) => setOrderForm({ ...orderForm, planned_qty: Number(e.target.value) })}
                    className="w-full text-sm border p-2 rounded focus:outline-none text-right font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số lô quản lý (Lot No.)</label>
                  <input
                    type="text"
                    placeholder="VD: LOT-TP-202610-15"
                    value={orderForm.lot_number}
                    onChange={(e) => setOrderForm({ ...orderForm, lot_number: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú / Đơn hàng liên quan</label>
                <input
                  type="text"
                  placeholder="Ghi chú đơn hàng khách hoặc mục đích SX..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="w-full text-sm border p-2 rounded focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800"
                >
                  Tạo lệnh sản xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Báo cáo Hoàn thành & Nhập kho */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
              Báo cáo hoàn thành & Nhập kho sản phẩm
            </h3>
            <div className="text-xs text-slate-600">
              Lệnh SX: <strong>{selectedOrder?.code}</strong> ({selectedOrder?.target_item_name})
            </div>

            <form onSubmit={handleFinishOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sản lượng đạt (*)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={finishForm.actualQty}
                    onChange={(e) => setFinishForm({ ...finishForm, actualQty: Number(e.target.value) })}
                    className="w-full text-sm border p-2 rounded focus:outline-none font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phế phẩm / Lỗi</label>
                  <input
                    type="number"
                    min="0"
                    value={finishForm.defectiveQty}
                    onChange={(e) => setFinishForm({ ...finishForm, defectiveQty: Number(e.target.value) })}
                    className="w-full text-sm border p-2 rounded focus:outline-none font-bold text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú hoàn thành</label>
                <input
                  type="text"
                  placeholder="Ghi chú chất lượng, QC..."
                  value={finishForm.note}
                  onChange={(e) => setFinishForm({ ...finishForm, note: e.target.value })}
                  className="w-full text-sm border p-2 rounded focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700"
                >
                  Xác nhận nhập kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
