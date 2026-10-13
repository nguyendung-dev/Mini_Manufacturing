import React, { useState, useEffect } from 'react';
import { fetchApi, formatMoney, formatNumber } from '../api';
import { exportToExcel } from '../utils/excel';

export default function CostingView() {
  const [costings, setCostings] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [showCalculateModal, setShowCalculateModal] = useState(false);

  // Form tính giá thành
  const [calcForm, setCalcForm] = useState({
    production_order_id: '',
    labor_cost: 500000,
    overhead_cost: 300000
  });

  const loadData = async () => {
    try {
      const list = await fetchApi('/costings');
      setCostings(list);

      const ords = await fetchApi('/production/orders');
      setCompletedOrders(ords.filter(o => ['COMPLETED', 'IN_PROGRESS'].includes(o.status)));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/costings/calculate', {
        method: 'POST',
        body: JSON.stringify(calcForm)
      });
      alert(`Tính giá thành thành công! Giá thành đơn vị: ${formatMoney(res.unitCost)}`);
      setShowCalculateModal(false);
      loadData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleExportCostingExcel = () => {
    const exportData = costings.map((c, idx) => ({
      'STT': idx + 1,
      'Mã quyết toán': c.id,
      'Số Lệnh SX': c.production_order_code,
      'Mã thành phẩm': c.target_item_code,
      'Tên sản phẩm': c.target_item_name,
      'SL hoàn thành': Number(c.completed_qty),
      'Chi phí NVL (VNĐ)': Number(c.material_cost),
      'Chi phí Nhân công (VNĐ)': Number(c.labor_cost),
      'Chi phí SX Chung (VNĐ)': Number(c.overhead_cost),
      'Tổng chi phí (VNĐ)': Number(c.total_cost),
      'Giá thành Đơn vị (VNĐ)': Number(c.unit_cost),
      'Định mức BOM chuẩn (VNĐ)': Number(c.standard_bom_cost),
      'Chênh lệch (VNĐ)': Number(c.variance)
    }));
    exportToExcel(exportData, 'Bang_Quyet_Toan_Gia_Thanh_LSX', 'Gia_Thanh');
  };

  const [selectedCosting, setSelectedCosting] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleViewDetail = async (costingId) => {
    try {
      setLoadingDetail(true);
      const data = await fetchApi(`/costings/${costingId}`);
      setSelectedCosting(data);
      setShowDetailModal(true);
    } catch (err) {
      alert('Lỗi tải chi tiết quyết toán: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteCosting = async (costingId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn xóa bản ghi quyết toán [${costingId}] không? Bạn có thể tính toán lại sau.`)) return;
    try {
      await fetchApi(`/costings/${costingId}`, { method: 'DELETE' });
      alert('Đã xóa bản ghi quyết toán giá thành.');
      if (showDetailModal && selectedCosting?.id === costingId) {
        setShowDetailModal(false);
      }
      loadData();
    } catch (err) {
      alert('Lỗi xóa: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Module 07: Chi phí & Giá thành sản xuất</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tập hợp chi phí NVL thực dùng, chi phí nhân công, chi phí chung và kết chuyển giá thành theo lệnh
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCostingExcel}
            className="px-3.5 py-2 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 shadow-sm text-sm flex items-center gap-1.5"
            title="Xuất bảng giá thành ra Excel (.xlsx)"
          >
            📊 Xuất Excel
          </button>
          <button
            onClick={() => {
            if (completedOrders.length > 0) {
              setCalcForm({
                production_order_id: completedOrders[0].id,
                labor_cost: 500000,
                overhead_cost: 300000
              });
            }
            setShowCalculateModal(true);
          }}
          className="px-4 py-2 bg-blue-700 text-white rounded font-medium hover:bg-blue-800 shadow-sm text-sm"
        >
          + Quyết toán Giá thành Lệnh SX
        </button>
        </div>
      </div>

      {/* Bảng kết quả giá thành */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b">
            <tr>
              <th className="p-3">Mã quyết toán</th>
              <th className="p-3">Lệnh sản xuất</th>
              <th className="p-3">Sản phẩm hoàn thành</th>
              <th className="p-3 text-right">Sản lượng</th>
              <th className="p-3 text-right">Chi phí NVL</th>
              <th className="p-3 text-right">Nhân công</th>
              <th className="p-3 text-right">Chi phí chung</th>
              <th className="p-3 text-right">Tổng chi phí</th>
              <th className="p-3 text-right">Giá thành Đơn vị</th>
              <th className="p-3 text-right">Chênh lệch BOM</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {costings.map(c => (
              <tr 
                key={c.id} 
                onClick={() => handleViewDetail(c.id)}
                className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                title="Nhấp vào để xem chi tiết cơ cấu giá thành"
              >
                <td className="p-3 font-mono text-xs font-bold text-blue-700 group-hover:underline">{c.id}</td>
                <td className="p-3 font-mono text-xs font-semibold text-slate-700">{c.production_order_code}</td>
                <td className="p-3 font-medium text-slate-800">
                  {c.target_item_name}
                  <div className="text-xs text-slate-400 font-mono">{c.target_item_code}</div>
                </td>
                <td className="p-3 text-right font-bold text-slate-800">{formatNumber(c.completed_qty)}</td>
                <td className="p-3 text-right text-slate-700">{formatMoney(c.material_cost)}</td>
                <td className="p-3 text-right text-slate-700">{formatMoney(c.labor_cost)}</td>
                <td className="p-3 text-right text-slate-700">{formatMoney(c.overhead_cost)}</td>
                <td className="p-3 text-right font-bold text-slate-900">{formatMoney(c.total_cost)}</td>
                <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/50">{formatMoney(c.unit_cost)}</td>
                <td className={`p-3 text-right font-semibold ${c.variance <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {c.variance <= 0 ? `Tiết kiệm ${formatMoney(Math.abs(c.variance))}` : `Vượt định mức +${formatMoney(c.variance)}`}
                </td>
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleViewDetail(c.id)}
                      className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded border border-blue-200"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={(e) => handleDeleteCosting(c.id, e)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                      title="Xóa bản ghi quyết toán"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tính toán Quyết toán giá thành */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
              Quyết toán Giá thành theo Lệnh sản xuất
            </h3>

            <form onSubmit={handleCalculate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chọn Lệnh sản xuất (*)</label>
                <select
                  required
                  value={calcForm.production_order_id}
                  onChange={(e) => setCalcForm({ ...calcForm, production_order_id: e.target.value })}
                  className="w-full text-sm border p-2 rounded focus:outline-none font-medium"
                >
                  <option value="">-- Chọn lệnh SX cần tính giá --</option>
                  {completedOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      [{o.code}] {o.target_item_name} (Đạt: {formatNumber(o.actual_qty || o.planned_qty)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chi phí Nhân công trực tiếp (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={calcForm.labor_cost}
                  onChange={(e) => setCalcForm({ ...calcForm, labor_cost: Number(e.target.value) })}
                  className="w-full text-sm border p-2 rounded focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chi phí Sản xuất chung (Điện, khấu hao máy, phụ phẩm... VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={calcForm.overhead_cost}
                  onChange={(e) => setCalcForm({ ...calcForm, overhead_cost: Number(e.target.value) })}
                  className="w-full text-sm border p-2 rounded focus:outline-none font-bold"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                Hệ thống sẽ tự động tổng hợp chi phí <strong>Nguyên vật liệu thực tế đã cấp phát</strong> theo số lượng tiêu hao và đơn giá xuất kho để tính ra tổng giá thành hoàn thiện.
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCalculateModal(false)}
                  className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800"
                >
                  Tính & Kết chuyển giá thành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Quyết toán Giá thành (Phiếu tính giá thành) */}
      {showDetailModal && selectedCosting && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    PHIẾU QUYẾT TOÁN GIÁ THÀNH THỰC TẾ
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                    {selectedCosting.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Lệnh SX: <strong className="text-slate-700">{selectedCosting.production_order_code}</strong> | 
                  Ngày quyết toán: {new Date(selectedCosting.date).toLocaleDateString('vi-VN')} {selectedCosting.lot_number ? `| Lô: ${selectedCosting.lot_number}` : ''}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Thông tin đối tượng sản phẩm */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Sản phẩm hoàn thành:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedCosting.target_item_name}</span>
                <span className="font-mono text-slate-400 block">{selectedCosting.target_item_code}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sản lượng nhập kho:</span>
                <span className="font-bold text-slate-800 text-base">{formatNumber(selectedCosting.completed_qty)} <span className="text-xs font-normal text-slate-500">sản phẩm</span></span>
              </div>
              <div>
                <span className="text-slate-500 block">Đánh giá chênh lệch BOM:</span>
                <span className={`inline-block px-2 py-1 rounded font-bold mt-0.5 ${selectedCosting.variance <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {selectedCosting.variance <= 0 ? `Tiết kiệm ${formatMoney(Math.abs(selectedCosting.variance))} / SP` : `Vượt định mức +${formatMoney(selectedCosting.variance)} / SP`}
                </span>
              </div>
            </div>

            {/* Cơ cấu 3 nhóm chi phí */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">1. Cơ cấu chi phí sản xuất thực tế</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                  <div className="text-slate-500">Chi phí NVL trực tiếp</div>
                  <div className="text-sm font-bold text-blue-900 mt-1">{formatMoney(selectedCosting.material_cost)}</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    {selectedCosting.total_cost > 0 ? ((Number(selectedCosting.material_cost) / Number(selectedCosting.total_cost)) * 100).toFixed(1) : 0}% tổng chi phí
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg">
                  <div className="text-slate-500">Chi phí Nhân công</div>
                  <div className="text-sm font-bold text-indigo-900 mt-1">{formatMoney(selectedCosting.labor_cost)}</div>
                  <div className="text-[11px] text-indigo-700 mt-0.5">
                    {selectedCosting.total_cost > 0 ? ((Number(selectedCosting.labor_cost) / Number(selectedCosting.total_cost)) * 100).toFixed(1) : 0}% tổng chi phí
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                  <div className="text-slate-500">Chi phí Sản xuất chung</div>
                  <div className="text-sm font-bold text-amber-900 mt-1">{formatMoney(selectedCosting.overhead_cost)}</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {selectedCosting.total_cost > 0 ? ((Number(selectedCosting.overhead_cost) / Number(selectedCosting.total_cost)) * 100).toFixed(1) : 0}% tổng chi phí
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-white rounded-lg">
                  <div className="text-slate-300">Giá thành 1 Đơn vị</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">{formatMoney(selectedCosting.unit_cost)}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tổng: {formatMoney(selectedCosting.total_cost)}
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết nguyên vật liệu tiêu hao */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">2. Chi tiết vật tư tiêu hao thực tế của lệnh</h4>
                <span className="text-[11px] text-slate-500">Xuất từ KHO-NVL xưởng gỗ</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b sticky top-0">
                    <tr>
                      <th className="p-2">Vật tư / Phụ kiện</th>
                      <th className="p-2 text-right">SL Kế hoạch</th>
                      <th className="p-2 text-right">SL Thực dùng</th>
                      <th className="p-2 text-right">Đơn giá vốn</th>
                      <th className="p-2 text-right">Thành tiền NVL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedCosting.materials || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-400">
                          Chưa có bảng kê chi tiết vật tư
                        </td>
                      </tr>
                    ) : (
                      (selectedCosting.materials || []).map((m, idx) => {
                        const used = Number(m.actual_used_qty || m.allocated_qty || m.planned_qty);
                        const price = Number(m.cost_price || 0);
                        const rowTotal = used * price;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2">
                              <div className="font-semibold text-slate-800">{m.item_name}</div>
                              <div className="text-slate-400 font-mono text-[10px]">{m.item_code}</div>
                            </td>
                            <td className="p-2 text-right text-slate-600">{formatNumber(m.planned_qty)} {m.item_unit}</td>
                            <td className="p-2 text-right font-bold text-blue-700">{formatNumber(used)} {m.item_unit}</td>
                            <td className="p-2 text-right text-slate-600">{formatMoney(price)}</td>
                            <td className="p-2 text-right font-bold text-slate-800">{formatMoney(rowTotal)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={(e) => handleDeleteCosting(selectedCosting.id, e)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-semibold"
              >
                Xóa phiếu quyết toán
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded text-xs font-semibold"
                >
                  🖨️ In phiếu
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
