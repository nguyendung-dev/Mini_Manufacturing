import React, { useState, useEffect } from 'react';
import { fetchApi, formatNumber } from '../api';

export default function MrpView() {
  const [boms, setBoms] = useState([]);
  const [selectedBomId, setSelectedBomId] = useState('');
  const [planQty, setPlanQty] = useState(10);
  const [mrpResult, setMrpResult] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quick Stock-in modal state
  const [quickStockModal, setQuickStockModal] = useState(null);
  const [isSubmittingQuickStock, setIsSubmittingQuickStock] = useState(false);

  const loadData = async () => {
    try {
      const bList = await fetchApi('/boms');
      setBoms(bList || []);
      if (bList && bList.length > 0 && !selectedBomId) {
        setSelectedBomId(bList[0].id);
      }
      const whs = await fetchApi('/catalog/warehouses');
      setWarehouses(whs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async (bomId, qty) => {
    if (!bomId) return;
    setLoading(true);
    try {
      const res = await fetchApi(`/boms/${bomId}/calculate-requirement`, {
        method: 'POST',
        body: JSON.stringify({ plannedQty: qty })
      });
      setMrpResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBomId) {
      handleCalculate(selectedBomId, planQty);
    }
  }, [selectedBomId, planQty]);

  const selectedBom = boms.find(b => b.id === selectedBomId);

  // Mở modal nhập kho nhanh khi thiếu vật tư
  const handleOpenQuickStock = (req) => {
    const defaultWh = warehouses.find(w =>
      w.type === 'RAW' ||
      w.id?.includes('NVL') ||
      w.name?.toLowerCase().includes('nguyên vật liệu') ||
      w.name?.toLowerCase().includes('vật tư') ||
      w.name?.toLowerCase().includes('gỗ')
    )?.id || warehouses[0]?.id || '';

    const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);

    setQuickStockModal({
      itemId: req.itemId,
      itemName: req.itemName,
      itemCode: req.itemCode,
      unit: req.unit,
      shortage: req.shortage,
      qty: req.shortage,
      destWarehouseId: defaultWh,
      lotNumber: `LOT-${todayStr}-${randomSuffix}`,
      price: 0,
      note: `Nhập bổ sung theo MRP [${selectedBom?.code || ''}]`
    });
  };

  // Xác nhận nhập kho
  const handleConfirmQuickStock = async (e) => {
    e.preventDefault();
    if (!quickStockModal) return;
    if (!quickStockModal.destWarehouseId) {
      alert('Vui lòng chọn kho nhập.');
      return;
    }
    if (Number(quickStockModal.qty) <= 0) {
      alert('Số lượng nhập phải lớn hơn 0.');
      return;
    }

    setIsSubmittingQuickStock(true);
    try {
      await fetchApi('/inventory/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'IN_PURCHASE',
          status: 'POSTED',
          dest_warehouse_id: quickStockModal.destWarehouseId,
          note: quickStockModal.note,
          items: [{
            item_id: quickStockModal.itemId,
            lot_number: quickStockModal.lotNumber || 'LOT-AUTO',
            qty: Number(quickStockModal.qty),
            price: Number(quickStockModal.price || 0)
          }]
        })
      });

      alert('Đã nhập kho thành công.');
      setQuickStockModal(null);

      if (selectedBomId) {
        handleCalculate(selectedBomId, planQty);
      }
    } catch (err) {
      alert('Lỗi nhập kho: ' + (err.message || 'Không thể tạo phiếu nhập'));
    } finally {
      setIsSubmittingQuickStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nhu cầu vật tư (MRP Kế hoạch)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tính toán nhu cầu nguyên vật liệu theo kế hoạch sản xuất, đối chiếu tồn kho và cảnh báo thiếu hàng
          </p>
        </div>
      </div>

      {/* Bộ lọc chọn BOM & Số lượng sản xuất */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Chọn sản phẩm / Định mức gia công:
            </label>
            <select
              value={selectedBomId}
              onChange={(e) => setSelectedBomId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {boms.map((b) => (
                <option key={b.id} value={b.id}>
                  [{b.code}] {b.name} (Mục tiêu: {b.target_item_name})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Số lượng cần sản xuất ({selectedBom?.target_item_unit || 'SP'}):
            </label>
            <input
              type="number"
              min="1"
              value={planQty}
              onChange={(e) => setPlanQty(Math.max(1, Number(e.target.value)))}
              className="w-full h-9 px-3 text-right font-bold rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={() => handleCalculate(selectedBomId, planQty)}
              disabled={loading}
              className="w-full h-9 inline-flex items-center justify-center rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang tính toán...' : 'Tính lại nhu cầu'}
            </button>
          </div>
        </div>
      </div>

      {/* Bảng Nhu cầu vật tư MRP - Full Width Nằm Ngang */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Bảng đối chiếu nhu cầu vật tư: {selectedBom?.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kế hoạch: <strong>{planQty} {selectedBom?.target_item_unit}</strong> | Phiên bản: v{selectedBom?.version || '1.0'}
            </p>
          </div>

          {mrpResult?.requirements && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                Tổng số vật tư: <strong>{mrpResult.requirements.length}</strong>
              </span>
              <span className="text-rose-600 font-medium">
                Thiếu: <strong>{mrpResult.requirements.filter(r => r.shortage > 0).length} loại</strong>
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[850px] whitespace-nowrap">
            <thead className="text-[11px] uppercase bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Vật tư cần dùng</th>
                <th className="p-3 text-right">Định mức/SP</th>
                <th className="p-3 text-right">Hao hụt (%)</th>
                <th className="p-3 text-right">Tổng nhu cầu (+Hao hụt)</th>
                <th className="p-3 text-right">Tồn kho hiện có</th>
                <th className="p-3 text-right">Cần mua thêm (Thiếu)</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mrpResult?.requirements?.length > 0 ? (
                mrpResult.requirements.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{req.itemName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.itemCode}</div>
                    </td>
                    <td className="p-3 text-right text-slate-700 font-medium">
                      {formatNumber(req.standardQty)} {req.unit}
                    </td>
                    <td className="p-3 text-right text-slate-500 font-medium">
                      {req.scrapRate}%
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatNumber(req.totalRequired)} {req.unit}
                    </td>
                    <td className="p-3 text-right font-semibold text-blue-700">
                      {formatNumber(req.currentStock)} {req.unit}
                    </td>
                    <td className={`p-3 text-right font-bold ${req.shortage > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {req.shortage > 0 ? `${formatNumber(req.shortage)} ${req.unit}` : '0'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        req.status === 'ĐỦ_HÀNG'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {req.status === 'ĐỦ_HÀNG' ? 'Đủ hàng' : 'Thiếu hàng'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {req.shortage > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenQuickStock(req)}
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors"
                        >
                          Nhập kho
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    {loading ? 'Đang tính toán nhu cầu vật tư...' : 'Chưa có dữ liệu vật tư.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nhập kho vật tư */}
      {quickStockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Nhập kho vật tư
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập bổ sung số lượng vật tư còn thiếu vào kho.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickStockModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Mặt hàng:</span>
                <span className="font-medium text-slate-800">{quickStockModal.itemName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã vật tư:</span>
                <span className="font-mono text-slate-600">{quickStockModal.itemCode}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Số lượng thiếu:</span>
                <span className="font-semibold text-red-600">{formatNumber(quickStockModal.shortage)} {quickStockModal.unit}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmQuickStock} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kho nhập</label>
                <select
                  required
                  value={quickStockModal.destWarehouseId}
                  onChange={(e) => setQuickStockModal({ ...quickStockModal, destWarehouseId: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="">-- Chọn kho nhập --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      [{wh.code}] {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Số lượng ({quickStockModal.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    value={quickStockModal.qty}
                    onChange={(e) => setQuickStockModal({ ...quickStockModal, qty: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Số lô
                  </label>
                  <input
                    type="text"
                    value={quickStockModal.lotNumber}
                    onChange={(e) => setQuickStockModal({ ...quickStockModal, lotNumber: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Đơn giá (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quickStockModal.price}
                  onChange={(e) => setQuickStockModal({ ...quickStockModal, price: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={quickStockModal.note}
                  onChange={(e) => setQuickStockModal({ ...quickStockModal, note: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickStockModal(null)}
                  disabled={isSubmittingQuickStock}
                  className="h-8 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickStock}
                  className="h-8 px-3 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isSubmittingQuickStock ? 'Đang lưu...' : 'Nhập kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
