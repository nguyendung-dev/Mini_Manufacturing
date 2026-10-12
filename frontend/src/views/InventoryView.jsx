import React, { useState, useEffect } from 'react';
import { fetchApi, formatMoney, formatNumber } from '../api';
import { exportToExcel } from '../utils/excel';

export default function InventoryView({ onOpenTraceModal }) {
  const [subTab, setSubTab] = useState('stock'); // stock | transactions
  const [stockList, setStockList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedWh, setSelectedWh] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form tạo phiếu kho mới
  const [txForm, setTxForm] = useState({
    code: '',
    date: new Date().toISOString().split('T')[0],
    type: 'IN_PURCHASE', // IN_PURCHASE | IN_PRODUCTION | OUT_PRODUCTION | OUT_SALE | TRANSFER | ADJUST
    status: 'DRAFT',
    source_warehouse_id: '',
    dest_warehouse_id: 'WH-NVL',
    ref_code: '',
    note: '',
    items: [{ item_id: '', lot_number: '', qty: 1, price: 0 }]
  });

  const loadData = async () => {
    try {
      const whs = await fetchApi('/catalog/warehouses');
      setWarehouses(whs);

      const itms = await fetchApi('/catalog/items');
      setItems(itms);

      if (subTab === 'stock') {
        const query = new URLSearchParams();
        if (selectedWh) query.append('warehouseId', selectedWh);
        if (typeFilter) query.append('type', typeFilter);
        if (search) query.append('search', search);
        const res = await fetchApi(`/inventory/stock?${query.toString()}`);
        setStockList(res);
      } else {
        const res = await fetchApi('/inventory/transactions');
        setTransactions(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, selectedWh, typeFilter, search]);

  const handlePostTransaction = async (id) => {
    if (!window.confirm('Xác nhận ghi sổ chứng từ kho này? Số lượng tồn kho sẽ thay đổi chính thức.')) return;
    try {
      await fetchApi(`/inventory/transactions/${id}/post`, { method: 'POST' });
      alert('Ghi sổ thành công!');
      loadData();
    } catch (err) {
      alert(`Lỗi ghi sổ: ${err.message}`);
    }
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/inventory/transactions', {
        method: 'POST',
        body: JSON.stringify(txForm)
      });
      alert('Tạo chứng từ kho thành công!');
      setShowCreateModal(false);
      setTxForm({
        code: '',
        date: new Date().toISOString().split('T')[0],
        type: 'IN_PURCHASE',
        status: 'DRAFT',
        source_warehouse_id: '',
        dest_warehouse_id: 'WH-NVL',
        ref_code: '',
        note: '',
        items: [{ item_id: '', lot_number: '', qty: 1, price: 0 }]
      });
      loadData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const addLine = () => {
    setTxForm({
      ...txForm,
      items: [...txForm.items, { item_id: items[0]?.id || '', lot_number: '', qty: 1, price: 0 }]
    });
  };

  const removeLine = (idx) => {
    if (txForm.items.length <= 1) return;
    setTxForm({
      ...txForm,
      items: txForm.items.filter((_, i) => i !== idx)
    });
  };

  const handleExportStockExcel = () => {
    if (subTab === 'stock') {
      const exportData = stockList.map((s, idx) => ({
        'STT': idx + 1,
        'Mã kho': s.warehouse_code,
        'Tên kho': s.warehouse_name,
        'Mã hàng': s.item_code,
        'Tên hàng hóa': s.item_name,
        'Phân loại': s.item_type,
        'Số lô (Lot No)': s.lot_number,
        'Số lượng tồn': Number(s.quantity),
        'Đơn vị tính': s.item_unit,
        'Đơn giá vốn': Number(s.cost_price),
        'Tổng giá trị (VNĐ)': Number(s.total_value)
      }));
      exportToExcel(exportData, 'Bao_Cao_Ton_Kho_Theo_Lo', 'Ton_Kho');
    } else {
      const exportData = transactions.map((t, idx) => ({
        'STT': idx + 1,
        'Số chứng từ': t.code,
        'Ngày lập': new Date(t.date).toLocaleDateString('vi-VN'),
        'Loại phiếu': t.type,
        'Kho xuất': t.source_warehouse_name || '-',
        'Kho nhập': t.dest_warehouse_name || '-',
        'Đối tác': t.partner_name || '-',
        'Mặt hàng & Lô': (t.items || []).map(i => `${i.item_name} (${i.qty} ${i.item_unit} - Lô: ${i.lot_number})`).join('; '),
        'Mã tham chiếu': t.ref_code || '-',
        'Ghi chú': t.note || '-',
        'Trạng thái': t.status === 'POSTED' ? 'Đã ghi sổ' : 'Bản nháp'
      }));
      exportToExcel(exportData, 'Lich_Su_Chung_Tu_Kho', 'Chung_Tu_Kho');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Module 02: Quản lý kho & Thẻ kho</h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi tồn kho theo 4 loại kho (NVL, BTP, TP, SX) và quản lý số lô nghiêm ngặt
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportStockExcel}
            className="px-3.5 py-2 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 shadow-sm text-sm flex items-center gap-1.5"
            title="Xuất bảng dữ liệu hiện tại ra Excel (.xlsx)"
          >
            📊 Xuất Excel
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-700 text-white rounded font-medium hover:bg-blue-800 shadow-sm text-sm"
          >
            + Lập phiếu Nhập / Xuất / Chuyển kho
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setSubTab('stock')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            subTab === 'stock' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tồn kho chi tiết theo Lô & Kho
        </button>
        <button
          onClick={() => setSubTab('transactions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            subTab === 'transactions' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Lịch sử chứng từ Kho (Nhập / Xuất / Chuyển)
        </button>
      </div>

      {/* Bộ lọc cho Tab Tồn kho */}
      {subTab === 'stock' && (
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Tìm mã hàng, tên hàng hoặc số lô..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500 font-medium">Kho:</span>
            <select
              value={selectedWh}
              onChange={(e) => setSelectedWh(e.target.value)}
              className="text-sm px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none"
            >
              <option value="">Tất cả kho</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>

            <span className="text-xs text-slate-500 font-medium ml-2">Loại:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none"
            >
              <option value="">Tất cả loại</option>
              <option value="NVL">NVL</option>
              <option value="BTP">Bán thành phẩm (BTP)</option>
              <option value="TP">Thành phẩm (TP)</option>
            </select>
          </div>
        </div>
      )}

      {/* Bảng tồn kho */}
      {subTab === 'stock' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Kho lưu trữ</th>
                <th className="p-3">Mã hàng</th>
                <th className="p-3">Tên hàng hóa</th>
                <th className="p-3">Loại</th>
                <th className="p-3">Số lô (Lot No.)</th>
                <th className="p-3 text-right">Số lượng tồn</th>
                <th className="p-3">ĐVT</th>
                <th className="p-3 text-right">Giá trị tồn</th>
                <th className="p-3 text-center">Truy xuất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockList.map(stk => (
                <tr key={stk.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <span className="font-semibold text-slate-800">{stk.warehouse_name}</span>
                    <span className="ml-1 text-xs text-slate-500 font-mono">({stk.warehouse_code})</span>
                  </td>
                  <td className="p-3 font-mono text-xs font-bold text-blue-700">{stk.item_code}</td>
                  <td className="p-3 font-medium text-slate-800">{stk.item_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      stk.item_type === 'NVL' ? 'bg-amber-100 text-amber-800' :
                      stk.item_type === 'BTP' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {stk.item_type}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs font-bold text-emerald-800 bg-emerald-50/50">
                    {stk.lot_number}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatNumber(stk.quantity)}
                  </td>
                  <td className="p-3 text-slate-600">{stk.item_unit}</td>
                  <td className="p-3 text-right text-slate-700 font-medium">
                    {formatMoney(stk.total_value)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onOpenTraceModal(stk.lot_number)}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-blue-100 text-blue-700 rounded font-medium border border-slate-200"
                    >
                      Tra cứu lô
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bảng chứng từ kho */}
      {subTab === 'transactions' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Số chứng từ</th>
                <th className="p-3">Ngày</th>
                <th className="p-3">Loại phiếu</th>
                <th className="p-3">Kho nguồn → Kho đích</th>
                <th className="p-3">Chi tiết hàng & Số lô</th>
                <th className="p-3">Mã tham chiếu / Ghi chú</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-bold text-blue-700">{tx.code}</td>
                  <td className="p-3 text-xs text-slate-600">
                    {new Date(tx.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-3 text-xs font-medium">
                    {tx.type === 'IN_PURCHASE' && <span className="text-emerald-700 font-semibold">Nhập mua</span>}
                    {tx.type === 'TRANSFER' && <span className="text-indigo-700 font-semibold">Chuyển kho / SX</span>}
                    {tx.type === 'IN_PRODUCTION' && <span className="text-purple-700 font-semibold">Nhập TP/BTP</span>}
                    {tx.type === 'OUT_SALE' && <span className="text-blue-700 font-semibold">Xuất bán</span>}
                    {tx.type === 'OUT_PRODUCTION' && <span className="text-amber-700 font-semibold">Xuất xưởng</span>}
                  </td>
                  <td className="p-3 text-xs">
                    {tx.source_warehouse_name ? <span className="text-slate-600">{tx.source_warehouse_name} → </span> : ''}
                    <span className="font-semibold text-slate-800">{tx.dest_warehouse_name || 'Xuất bên ngoài'}</span>
                  </td>
                  <td className="p-3 text-xs space-y-1">
                    {(tx.items || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="font-medium text-slate-800">{it.item_name}</span>
                        <span className="font-mono text-blue-600 font-semibold">{formatNumber(it.qty)} {it.item_unit}</span>
                        <span className="font-mono text-emerald-700">[{it.lot_number}]</span>
                      </div>
                    ))}
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {tx.ref_code && <div className="font-mono text-slate-700 font-bold">{tx.ref_code}</div>}
                    <div>{tx.note}</div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      tx.status === 'POSTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tx.status === 'POSTED' ? 'Đã ghi sổ' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {tx.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePostTransaction(tx.id)}
                        className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-sm"
                      >
                        Ghi sổ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Lập phiếu kho */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
              Lập phiếu Nhập / Xuất / Chuyển kho mới
            </h3>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Loại giao dịch (*)</label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  >
                    <option value="IN_PURCHASE">Nhập mua NVL</option>
                    <option value="TRANSFER">Chuyển kho / Cấp phát</option>
                    <option value="IN_PRODUCTION">Nhập BTP / Thành phẩm</option>
                    <option value="OUT_SALE">Xuất bán hàng</option>
                    <option value="OUT_PRODUCTION">Xuất cho phân xưởng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày lập (*)</label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Trạng thái ban đầu</label>
                  <select
                    value={txForm.status}
                    onChange={(e) => setTxForm({ ...txForm, status: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  >
                    <option value="DRAFT">Lưu nháp (Chưa đổi tồn)</option>
                    <option value="POSTED">Ghi sổ ngay (Trừ/Cộng tồn)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kho xuất (Kho nguồn)
                  </label>
                  <select
                    value={txForm.source_warehouse_id}
                    onChange={(e) => setTxForm({ ...txForm, source_warehouse_id: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  >
                    <option value="">-- Không chọn (Nếu nhập mới) --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kho nhập (Kho đích)
                  </label>
                  <select
                    value={txForm.dest_warehouse_id}
                    onChange={(e) => setTxForm({ ...txForm, dest_warehouse_id: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  >
                    <option value="">-- Không chọn (Nếu xuất bán) --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mã tham chiếu (Đơn mua / LSX)</label>
                  <input
                    type="text"
                    placeholder="VD: LSX-202610-001 hoặc PO-01"
                    value={txForm.ref_code}
                    onChange={(e) => setTxForm({ ...txForm, ref_code: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú diễn giải</label>
                  <input
                    type="text"
                    value={txForm.note}
                    onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* Danh sách mặt hàng trong phiếu */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase text-slate-700">Chi tiết mặt hàng & Số lô</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs text-blue-700 font-semibold hover:underline"
                  >
                    + Thêm dòng
                  </button>
                </div>

                {txForm.items.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-slate-200">
                    <div className="sm:col-span-5">
                      <select
                        required
                        value={line.item_id}
                        onChange={(e) => {
                          const newItems = [...txForm.items];
                          newItems[idx].item_id = e.target.value;
                          setTxForm({ ...txForm, items: newItems });
                        }}
                        className="w-full text-xs border p-1.5 rounded focus:outline-none"
                      >
                        <option value="">-- Chọn mặt hàng --</option>
                        {items.map(it => (
                          <option key={it.id} value={it.id}>[{it.code}] {it.name} ({it.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Số lô (Lot No.)"
                        required
                        value={line.lot_number}
                        onChange={(e) => {
                          const newItems = [...txForm.items];
                          newItems[idx].lot_number = e.target.value;
                          setTxForm({ ...txForm, items: newItems });
                        }}
                        className="w-full text-xs border p-1.5 rounded font-mono focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="Số lượng"
                        required
                        value={line.qty}
                        onChange={(e) => {
                          const newItems = [...txForm.items];
                          newItems[idx].qty = Number(e.target.value);
                          setTxForm({ ...txForm, items: newItems });
                        }}
                        className="w-full text-xs border p-1.5 rounded text-right focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
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
                  Lưu phiếu kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
