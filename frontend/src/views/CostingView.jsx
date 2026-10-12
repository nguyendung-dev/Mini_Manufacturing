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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {costings.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-xs font-bold text-blue-700">{c.id}</td>
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
    </div>
  );
}
