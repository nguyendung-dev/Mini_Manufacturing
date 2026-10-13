import React, { useState, useEffect } from 'react';
import { fetchApi, formatMoney, formatNumber } from '../api';

export default function BomView() {
  const [boms, setBoms] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedBom, setSelectedBom] = useState(null);
  const [planQty, setPlanQty] = useState(10);
  const [mrpResult, setMrpResult] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Quick Stock-in modal state
  const [quickStockModal, setQuickStockModal] = useState(null);
  const [isSubmittingQuickStock, setIsSubmittingQuickStock] = useState(false);

  // Form tạo BOM
  const [bomForm, setBomForm] = useState({
    code: '',
    name: '',
    target_item_id: '',
    version: '1.0',
    standard_qty: 1,
    notes: '',
    components: [{ item_id: '', qty: 1, scrap_rate: 0, note: '' }]
  });

  const loadData = async () => {
    try {
      const bList = await fetchApi('/boms');
      setBoms(bList);
      if (selectedBom) {
        const updated = bList.find(b => b.id === selectedBom.id);
        if (updated) setSelectedBom(updated);
      }
      const itms = await fetchApi('/catalog/items');
      setItems(itms);

      const whs = await fetchApi('/catalog/warehouses');
      setWarehouses(whs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tính nhu cầu vật tư (MRP) khi thay đổi số lượng hoặc chọn BOM
  const handleCalculateRequirement = async (bomId, qty) => {
    try {
      const res = await fetchApi(`/boms/${bomId}/calculate-requirement`, {
        method: 'POST',
        body: JSON.stringify({ plannedQty: qty })
      });
      setMrpResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedBom) {
      handleCalculateRequirement(selectedBom.id, planQty);
    }
  }, [selectedBom, planQty]);

  // Mở modal nhập kho cho vật tư thiếu
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
      note: `Nhập bổ sung theo BOM ${selectedBom?.code || ''}`
    });
  };

  // Xác nhận nhập kho và ghi sổ
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

      if (selectedBom) {
        handleCalculateRequirement(selectedBom.id, planQty);
      }
    } catch (err) {
      alert('Lỗi nhập kho: ' + (err.message || 'Không thể tạo phiếu nhập'));
    } finally {
      setIsSubmittingQuickStock(false);
    }
  };

  const addCompLine = () => {
    setBomForm({
      ...bomForm,
      components: [...bomForm.components, { item_id: '', qty: 1, scrap_rate: 0, note: '' }]
    });
  };

  const removeCompLine = (idx) => {
    if (bomForm.components.length <= 1) return;
    setBomForm({
      ...bomForm,
      components: bomForm.components.filter((_, i) => i !== idx)
    });
  };

  const handleSaveBom = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/boms', {
        method: 'POST',
        body: JSON.stringify(bomForm)
      });
      alert('Tạo định mức BOM thành công!');
      setShowCreateModal(false);
      setBomForm({
        code: '',
        name: '',
        target_item_id: '',
        version: '1.0',
        standard_qty: 1,
        notes: '',
        components: [{ item_id: '', qty: 1, scrap_rate: 0, note: '' }]
      });
      loadData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleDeleteBom = async (bom) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa định mức BOM "${bom.name}" (${bom.code})?`)) return;
    try {
      await fetchApi(`/boms/${bom.id}`, { method: 'DELETE' });
      if (selectedBom?.id === bom.id) setSelectedBom(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {selectedBom ? (
        /* TRANG CHI TIẾT ĐỊNH MỨC */
        <div className="space-y-6">
          {/* Top banner với nút Quay lại danh sách và thông tin định mức */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedBom(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại danh sách định mức
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedBom.code}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{selectedBom.name}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">
                  v{selectedBom.version}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sản phẩm / BTP mục tiêu: <span className="font-semibold text-slate-800">{selectedBom.target_item_name}</span> ({selectedBom.target_item_code}) — Sản lượng chuẩn: <span className="font-semibold text-slate-800">{selectedBom.standard_qty} {selectedBom.target_item_unit}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right bg-slate-50 px-3 py-2 rounded border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Giá thành kế hoạch chuẩn</div>
                <div className="text-base font-bold text-emerald-700">{formatMoney(selectedBom.estimatedCost)}</div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteBom(selectedBom)}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-red-200 transition-colors"
                title="Xóa định mức"
              >
                Xóa định mức
              </button>
            </div>
          </div>

          {/* Bảng 1: Chi tiết thành phần cấu thành BOM */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Bảng 1: Chi tiết cấu thành định mức
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Định mức vật tư tính cho <strong>{selectedBom.standard_qty} {selectedBom.target_item_unit}</strong> thành phẩm
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Giá thành kế hoạch chuẩn: </span>
                <strong className="text-sm font-bold text-emerald-700">{formatMoney(selectedBom.estimatedCost)}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Linh kiện / NVL</th>
                    <th className="p-2.5 text-right">Định mức</th>
                    <th className="p-2.5 text-right">Hao hụt (%)</th>
                    <th className="p-2.5 text-right">Đơn giá vốn</th>
                    <th className="p-2.5 text-right">Thành tiền</th>
                    <th className="p-2.5">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedBom.components?.map((c, i) => {
                    const totalReqUnit = Number(c.qty) * (1 + Number(c.scrap_rate || 0) / 100);
                    const cost = totalReqUnit * Number(c.cost_price || 0);
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <div className="font-medium text-slate-800">{c.item_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{c.item_code}</div>
                        </td>
                        <td className="p-2.5 text-right font-medium">
                          {formatNumber(c.qty)} {c.item_unit}
                        </td>
                        <td className="p-2.5 text-right text-slate-600 font-medium">
                          {c.scrap_rate}%
                        </td>
                        <td className="p-2.5 text-right text-slate-600">
                          {formatMoney(c.cost_price)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-800">
                          {formatMoney(cost)}
                        </td>
                        <td className="p-2.5 text-xs text-slate-500">{c.note || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng 2: Công cụ tính toán nhu cầu vật tư MRP theo quy mô sản xuất */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Bảng 2: Tính nhu cầu vật tư theo kế hoạch sản xuất
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập số lượng cần sản xuất để hệ thống đối chiếu với kho và cảnh báo thiếu hàng
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Số lượng cần SX:</label>
                <input
                  type="number"
                  min="1"
                  value={planQty}
                  onChange={(e) => setPlanQty(Math.max(1, Number(e.target.value)))}
                  className="w-20 text-sm font-bold border border-slate-300 rounded px-2.5 py-1 text-right focus:outline-none focus:border-blue-600"
                />
                <span className="text-xs text-slate-600 font-medium">{selectedBom.target_item_unit}</span>
              </div>
            </div>

            {mrpResult && (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left min-w-[750px] whitespace-nowrap">
                  <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                      <th className="p-3">Vật tư cần dùng</th>
                      <th className="p-3 text-right">Định mức/SP</th>
                      <th className="p-3 text-right">Tổng nhu cầu (+Hao hụt)</th>
                      <th className="p-3 text-right">Tồn kho hiện có</th>
                      <th className="p-3 text-right">Cần mua thêm (Thiếu)</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mrpResult.requirements?.map((req, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{req.itemName}</div>
                          <div className="text-xs text-slate-400 font-mono">{req.itemCode}</div>
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {formatNumber(req.standardQty)} {req.unit}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800">
                          {formatNumber(req.totalRequired)} {req.unit}
                        </td>
                        <td className="p-3 text-right font-semibold text-blue-700">
                          {formatNumber(req.currentStock)} {req.unit}
                        </td>
                        <td className={`p-3 text-right font-bold ${req.shortage > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TRANG DANH SÁCH TOÀN BỘ ĐỊNH MỨC GIA CÔNG */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Gia Công</h2>
              <p className="text-sm text-slate-500 mt-1">
                Thiết lập định mức gia công, cấu thành linh kiện vật tư và tỷ lệ hao hụt cho sản phẩm
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 shadow-sm text-xs transition-colors"
            >
              + Thêm mới
            </button>
          </div>

          {/* Bảng danh sách định mức Gia Công (Nằm ngang full width) */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Danh sách định mức gia công ({boms.length})
              </h3>
              <span className="text-xs text-slate-400">
                Nhấp vào dòng hoặc bấm "Xem chi tiết" để mở trang chi tiết định mức
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="text-[11px] uppercase bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Mã định mức</th>
                    <th className="p-3">Tên định mức gia công</th>
                    <th className="p-3">Sản phẩm / BTP mục tiêu</th>
                    <th className="p-3 text-center">Phiên bản</th>
                    <th className="p-3 text-right">Sản lượng chuẩn</th>
                    <th className="p-3 text-center">Số linh kiện</th>
                    <th className="p-3 text-right">Giá thành kế hoạch</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {boms.length > 0 ? (
                    boms.map((b) => (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBom(b)}
                        className="cursor-pointer transition-colors hover:bg-slate-50/80"
                      >
                        <td className="p-3 font-mono font-semibold text-blue-700">
                          {b.code}
                        </td>
                        <td className="p-3 font-medium text-slate-900">
                          {b.name}
                        </td>
                        <td className="p-3 text-slate-700">
                          {b.target_item_name}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700">
                            v{b.version}
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-700">
                          {b.standard_qty} {b.target_item_unit}
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-700">
                          {b.components?.length || 0}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {formatMoney(b.estimatedCost)}
                        </td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedBom(b)}
                              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                            >
                              Xem chi tiết →
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBom(b)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Xóa định mức"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                        Chưa có định mức gia công nào. Bấm "+ Thêm mới" để tạo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo mới BOM */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
              Tạo mới định mức BOM sản phẩm
            </h3>

            <form onSubmit={handleSaveBom} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mã BOM (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BOM-TP-01-V1"
                    value={bomForm.code}
                    onChange={(e) => setBomForm({ ...bomForm, code: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phiên bản</label>
                  <input
                    type="text"
                    value={bomForm.version}
                    onChange={(e) => setBomForm({ ...bomForm, version: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tên định mức (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Định mức Vỏ tủ 400x600"
                    value={bomForm.name}
                    onChange={(e) => setBomForm({ ...bomForm, name: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sản phẩm đích (*)</label>
                  <select
                    required
                    value={bomForm.target_item_id}
                    onChange={(e) => setBomForm({ ...bomForm, target_item_id: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  >
                    <option value="">-- Chọn BTP hoặc TP --</option>
                    {items.filter(i => ['BTP', 'TP'].includes(i.type)).map(it => (
                      <option key={it.id} value={it.id}>[{it.type}] {it.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Danh sách linh kiện trong BOM */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase text-slate-700">Linh kiện cấu thành & Tỷ lệ hao hụt</span>
                  <button
                    type="button"
                    onClick={addCompLine}
                    className="text-xs text-blue-700 font-semibold hover:underline"
                  >
                    + Thêm linh kiện
                  </button>
                </div>

                {bomForm.components.map((comp, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-slate-200">
                    <div className="sm:col-span-5">
                      <select
                        required
                        value={comp.item_id}
                        onChange={(e) => {
                          const newComps = [...bomForm.components];
                          newComps[idx].item_id = e.target.value;
                          setBomForm({ ...bomForm, components: newComps });
                        }}
                        className="w-full text-xs border p-1.5 rounded focus:outline-none"
                      >
                        <option value="">-- Chọn NVL hoặc BTP con --</option>
                        {items.map(it => (
                          <option key={it.id} value={it.id}>[{it.type}] {it.name} ({it.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="0.0001"
                        step="any"
                        placeholder="Số lượng định mức"
                        required
                        value={comp.qty}
                        onChange={(e) => {
                          const newComps = [...bomForm.components];
                          newComps[idx].qty = Number(e.target.value);
                          setBomForm({ ...bomForm, components: newComps });
                        }}
                        className="w-full text-xs border p-1.5 rounded text-right focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Hao hụt %"
                          value={comp.scrap_rate}
                          onChange={(e) => {
                            const newComps = [...bomForm.components];
                            newComps[idx].scrap_rate = Number(e.target.value);
                            setBomForm({ ...bomForm, components: newComps });
                          }}
                          className="w-full text-xs border p-1.5 rounded text-right focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 font-semibold">%</span>
                      </div>
                    </div>

                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeCompLine(idx)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
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
                  Lưu định mức BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
