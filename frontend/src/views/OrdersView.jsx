import React, { useState, useEffect } from 'react';
import { fetchApi, formatMoney, formatNumber } from '../api';
import { exportToExcel } from '../utils/excel';

export default function OrdersView({ initialTab = 'purchase' }) {
  const [tab, setTab] = useState(initialTab); // purchase | sales

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [items, setItems] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form tạo đơn mua / bán
  const [orderForm, setOrderForm] = useState({
    code: '',
    date: new Date().toISOString().split('T')[0],
    partner_id: '',
    notes: '',
    items: [{ item_id: '', qty: 10, unit_price: 0 }]
  });

  const loadData = async () => {
    try {
      const pList = await fetchApi('/catalog/partners');
      setPartners(pList);

      const itms = await fetchApi('/catalog/items');
      setItems(itms);

      if (tab === 'purchase') {
        const pOrders = await fetchApi('/orders/purchase');
        setPurchaseOrders(pOrders);
      } else {
        const sOrders = await fetchApi('/orders/sales');
        setSalesOrders(sOrders);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const endpoint = tab === 'purchase' ? '/orders/purchase' : '/orders/sales';
      await fetchApi(endpoint, {
        method: 'POST',
        body: JSON.stringify(orderForm)
      });
      alert(`Tạo ${tab === 'purchase' ? 'đơn mua' : 'đơn bán'} thành công!`);
      setShowCreateModal(false);
      setOrderForm({
        code: '',
        date: new Date().toISOString().split('T')[0],
        partner_id: '',
        notes: '',
        items: [{ item_id: '', qty: 10, unit_price: 0 }]
      });
      loadData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (order, type) => {
    const typeLabel = type === 'purchase' ? 'đơn mua hàng (PO)' : 'đơn bán hàng (SO)';
    if (!window.confirm(`Bạn có chắc chắn muốn hủy / xóa ${typeLabel} "${order.code}"?`)) return;
    try {
      await fetchApi(`/orders/${type}/${order.id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReceivePurchase = async (poId) => {
    if (!window.confirm('Xác nhận nhận hàng và tạo phiếu nhập kho NVL tự động?')) return;
    try {
      const res = await fetchApi(`/orders/purchase/${poId}/receive`, {
        method: 'POST',
        body: JSON.stringify({ destWarehouseId: 'WH-NVL' })
      });
      alert(`Đã nhận hàng thành công! Phiếu kho: ${res.txCode}`);
      loadData();
    } catch (err) {
      alert(`Lỗi nhận hàng: ${err.message}`);
    }
  };

  const handleDeliverSales = async (so) => {
    if (!window.confirm(`Xác nhận xuất kho TP giao hàng cho đơn [${so.code}]?`)) return;
    try {
      const deliveryItems = (so.items || []).map(it => ({
        itemId: it.item_id,
        qty: it.qty,
        unitPrice: it.unit_price,
        lotNumber: 'LOT-TP-202610-01'
      }));

      const res = await fetchApi(`/orders/sales/${so.id}/deliver`, {
        method: 'POST',
        body: JSON.stringify({
          sourceWarehouseId: 'WH-TP',
          items: deliveryItems
        })
      });
      alert(`Xuất giao hàng thành công! Phiếu kho: ${res.txCode}`);
      loadData();
    } catch (err) {
      alert(`Lỗi giao hàng: ${err.message}`);
    }
  };

  const addLine = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { item_id: items[0]?.id || '', qty: 10, unit_price: 0 }]
    });
  };

  const removeLine = (idx) => {
    if (orderForm.items.length <= 1) return;
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter((_, i) => i !== idx)
    });
  };

  const handleExportOrdersExcel = () => {
    if (tab === 'purchase') {
      const exportData = purchaseOrders.map((po, idx) => ({
        'STT': idx + 1,
        'Số đơn mua (PO)': po.code,
        'Ngày đặt': new Date(po.date).toLocaleDateString('vi-VN'),
        'Nhà cung cấp': po.partner_name,
        'Mặt hàng mua': (po.items || []).map(i => `${i.item_name} (SL: ${i.qty} ${i.item_unit} - Đã nhận: ${i.received_qty})`).join('; '),
        'Tổng tiền (VNĐ)': Number(po.total_amount),
        'Đã thanh toán (VNĐ)': Number(po.paid_amount),
        'Trạng thái': po.status === 'RECEIVED' ? 'Đã nhận đủ' : 'Chờ giao hàng',
        'Ghi chú': po.notes || '-'
      }));
      exportToExcel(exportData, 'Danh_Sach_Don_Mua_Hang_PO', 'Don_Mua_Hang');
    } else {
      const exportData = salesOrders.map((so, idx) => ({
        'STT': idx + 1,
        'Số đơn bán (SO)': so.code,
        'Ngày lập': new Date(so.date).toLocaleDateString('vi-VN'),
        'Khách hàng': so.partner_name,
        'Sản phẩm bán': (so.items || []).map(i => `${i.item_name} (SL: ${i.qty} ${i.item_unit})`).join('; '),
        'Tổng giá trị (VNĐ)': Number(so.total_amount),
        'Đã thu tiền (VNĐ)': Number(so.paid_amount),
        'Trạng thái giao': so.status === 'DELIVERED' ? 'Đã giao hàng' : 'Đang xử lý',
        'Ghi chú': so.notes || '-'
      }));
      exportToExcel(exportData, 'Danh_Sach_Don_Ban_Hang_SO', 'Don_Ban_Hang');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Đơn mua hàng (PO) & Đơn bán hàng (SO)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý đơn mua NVL từ NCC, đơn bán TP cho khách hàng và liên kết phiếu nhập/xuất kho
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportOrdersExcel}
            className="px-3.5 py-2 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 shadow-sm text-sm flex items-center gap-1.5"
            title="Xuất danh sách ra Excel (.xlsx)"
          >
            📊 Xuất Excel
          </button>
          <button
            onClick={() => {
              const defaultPartner = partners.find(p => tab === 'purchase' ? p.type === 'SUPPLIER' : p.type === 'CUSTOMER');
              setOrderForm({
                code: '',
                date: new Date().toISOString().split('T')[0],
                partner_id: defaultPartner?.id || '',
                notes: '',
                items: [{ item_id: '', qty: 10, unit_price: 0 }]
              });
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-700 text-white rounded font-medium hover:bg-blue-800 shadow-sm text-sm"
          >
            + Tạo {tab === 'purchase' ? 'Đơn mua hàng (PO)' : 'Đơn bán hàng (SO)'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setTab('purchase')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'purchase' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Đơn mua hàng (PO)
        </button>
        <button
          onClick={() => setTab('sales')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'sales' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Đơn bán hàng (SO)
        </button>
      </div>

      {/* Bảng Đơn Mua Hàng */}
      {tab === 'purchase' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[950px] whitespace-nowrap">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b">
              <tr>
                <th className="p-3">Số đơn mua (PO)</th>
                <th className="p-3">Ngày đặt</th>
                <th className="p-3">Nhà cung cấp</th>
                <th className="p-3">Mặt hàng mua</th>
                <th className="p-3 text-right">Tổng tiền</th>
                <th className="p-3 text-right">Đã thanh toán</th>
                <th className="p-3 text-center">Trạng thái nhận</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map(po => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-bold text-blue-700">{po.code}</td>
                  <td className="p-3 text-xs text-slate-600">{new Date(po.date).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3 font-medium text-slate-800">{po.partner_name}</td>
                  <td className="p-3 text-xs space-y-1">
                    {(po.items || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-800">{it.item_name}</span>
                        <span className="font-semibold text-blue-600 font-mono">
                          {formatNumber(it.qty)} {it.item_unit}
                        </span>
                        <span className="text-slate-400">({it.received_qty > 0 ? `Đã nhận ${formatNumber(it.received_qty)}` : 'Chưa nhận'})</span>
                      </div>
                    ))}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800">{formatMoney(po.total_amount)}</td>
                  <td className="p-3 text-right text-emerald-700 font-medium">{formatMoney(po.paid_amount)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${
                      po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${po.status === 'RECEIVED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {po.status === 'RECEIVED' ? 'Đã nhận hàng' : 'Chờ giao'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {po.status !== 'RECEIVED' && (
                        <button
                          onClick={() => handleReceivePurchase(po.id)}
                          className="px-2.5 py-1 text-xs bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded shadow-sm"
                        >
                          Nhận kho
                        </button>
                      )}
                      {po.status !== 'RECEIVED' && (
                        <button
                          onClick={() => handleDeleteOrder(po, 'purchase')}
                          className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                          title="Hủy / Xóa đơn PO"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bảng Đơn Bán Hàng */}
      {tab === 'sales' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[950px] whitespace-nowrap">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b">
              <tr>
                <th className="p-3">Số đơn bán (SO)</th>
                <th className="p-3">Ngày lập</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Sản phẩm xuất bán</th>
                <th className="p-3 text-right">Tổng giá trị</th>
                <th className="p-3 text-right">Đã thu tiền</th>
                <th className="p-3 text-center">Giao hàng</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesOrders.map(so => (
                <tr key={so.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-bold text-blue-700">{so.code}</td>
                  <td className="p-3 text-xs text-slate-600">{new Date(so.date).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3 font-medium text-slate-800">{so.partner_name}</td>
                  <td className="p-3 text-xs space-y-1">
                    {(so.items || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-800">{it.item_name}</span>
                        <span className="font-semibold text-blue-600 font-mono">
                          {formatNumber(it.qty)} {it.item_unit}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800">{formatMoney(so.total_amount)}</td>
                  <td className="p-3 text-right text-emerald-700 font-medium">{formatMoney(so.paid_amount)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${
                      so.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${so.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {so.status === 'DELIVERED' ? 'Đã giao hàng' : 'Đang xử lý'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {so.status !== 'DELIVERED' && (
                        <button
                          onClick={() => handleDeliverSales(so)}
                          className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-sm"
                        >
                          Xuất bán
                        </button>
                      )}
                      {so.status !== 'DELIVERED' && (
                        <button
                          onClick={() => handleDeleteOrder(so, 'sales')}
                          className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                          title="Hủy / Xóa đơn SO"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Lập Đơn mua / bán mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
              Lập {tab === 'purchase' ? 'Đơn mua hàng NVL (PO)' : 'Đơn bán hàng thành phẩm (SO)'}
            </h3>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {tab === 'purchase' ? 'Nhà cung cấp (*)' : 'Khách hàng (*)'}
                  </label>
                  <select
                    required
                    value={orderForm.partner_id}
                    onChange={(e) => setOrderForm({ ...orderForm, partner_id: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  >
                    <option value="">-- Chọn đối tác --</option>
                    {partners
                      .filter(p => tab === 'purchase' ? p.type === 'SUPPLIER' : p.type === 'CUSTOMER')
                      .map(p => (
                        <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                      ))}
                  </select>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú diễn giải</label>
                <input
                  type="text"
                  placeholder="Ghi chú đơn hàng..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="w-full text-sm border p-2 rounded focus:outline-none"
                />
              </div>

              {/* Danh sách dòng hàng */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase text-slate-700">Mặt hàng & Đơn giá</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs text-blue-700 font-semibold hover:underline"
                  >
                    + Thêm dòng
                  </button>
                </div>

                {orderForm.items.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-slate-200">
                    <div className="sm:col-span-5">
                      <select
                        required
                        value={line.item_id}
                        onChange={(e) => {
                          const newItems = [...orderForm.items];
                          const selected = items.find(i => i.id === e.target.value);
                          newItems[idx].item_id = e.target.value;
                          newItems[idx].unit_price = tab === 'purchase' ? (selected?.cost_price || 0) : (selected?.sale_price || 0);
                          setOrderForm({ ...orderForm, items: newItems });
                        }}
                        className="w-full text-xs border p-1.5 rounded focus:outline-none"
                      >
                        <option value="">-- Chọn mặt hàng --</option>
                        {items
                          .filter(i => tab === 'purchase' ? ['NVL', 'BTP'].includes(i.type) : ['TP', 'BTP'].includes(i.type))
                          .map(it => (
                            <option key={it.id} value={it.id}>[{it.type}] {it.name}</option>
                          ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Số lượng"
                        required
                        value={line.qty}
                        onChange={(e) => {
                          const newItems = [...orderForm.items];
                          newItems[idx].qty = Number(e.target.value);
                          setOrderForm({ ...orderForm, items: newItems });
                        }}
                        className="w-full text-xs border p-1.5 rounded text-right focus:outline-none font-bold"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        placeholder="Đơn giá"
                        required
                        value={line.unit_price}
                        onChange={(e) => {
                          const newItems = [...orderForm.items];
                          newItems[idx].unit_price = Number(e.target.value);
                          setOrderForm({ ...orderForm, items: newItems });
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
                  Tạo đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
