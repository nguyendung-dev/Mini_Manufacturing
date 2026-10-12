import React, { useState, useEffect } from 'react';
import { fetchApi, formatMoney, formatNumber } from '../api';

export default function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/reports/dashboard');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Đang tải dữ liệu tổng quan xưởng...
      </div>
    );
  }

  const {
    inventoryByType = {},
    totalInventoryValue = 0,
    productionCount = {},
    activeProductionOrders = 0,
    debts = {},
    salesRevenue = 0,
    purchaseExpense = 0,
    lowStockAlerts = [],
    recentTransactions = []
  } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner Tiêu đề & Làm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bảng điều hành Mini Manufacturing ERP</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp thời gian thực dữ liệu kho, sản xuất, công nợ và dòng tiền
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex gap-2">
          <button
            onClick={loadData}
            className="px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium shadow-sm"
          >
            Làm mới số liệu
          </button>
          <button
            onClick={() => onNavigate('production')}
            className="px-3 py-1.5 text-sm bg-blue-700 text-white rounded hover:bg-blue-800 font-medium shadow-sm"
          >
            + Lập Lệnh sản xuất
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tồn kho */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng giá trị tồn kho</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{formatMoney(totalInventoryValue)}</div>
          <div className="mt-2 text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-2">
            <span>NVL: <strong>{formatMoney(inventoryByType.NVL)}</strong></span>
            <span>BTP: <strong>{formatMoney(inventoryByType.BTP)}</strong></span>
            <span>TP: <strong>{formatMoney(inventoryByType.TP)}</strong></span>
          </div>
        </div>

        {/* Lệnh sản xuất */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lệnh SX đang vận hành</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{activeProductionOrders} lệnh</div>
          <div className="mt-2 text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-2">
            <span>Đang chạy: <strong>{productionCount.IN_PROGRESS || 0}</strong></span>
            <span>Đã hoàn thành: <strong>{productionCount.COMPLETED || 0}</strong></span>
          </div>
        </div>

        {/* Phải thu khách hàng */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Công nợ phải thu (KH)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{formatMoney(debts.receivable)}</div>
          <div className="mt-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
            Doanh số đơn bán: <strong>{formatMoney(salesRevenue)}</strong>
          </div>
        </div>

        {/* Phải trả nhà cung cấp */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Công nợ phải trả (NCC)</div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{formatMoney(debts.payable)}</div>
          <div className="mt-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
            Tổng tiền mua NVL: <strong>{formatMoney(purchaseExpense)}</strong>
          </div>
        </div>
      </div>

      {/* Grid 2 cột: Cảnh báo tồn kho + Giao dịch kho gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cảnh báo mức tồn tối thiểu */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Cảnh báo tồn kho dưới mức tối thiểu
            </h3>
            <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold">
              {lowStockAlerts.length} mặt hàng
            </span>
          </div>
          <div className="p-4">
            {lowStockAlerts.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-6">
                Tất cả mặt hàng đều đạt hoặc vượt định mức tồn an toàn.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-2">Mã & Tên hàng</th>
                    <th className="p-2 text-right">Tồn hiện có</th>
                    <th className="p-2 text-right">Tối thiểu</th>
                    <th className="p-2 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockAlerts.map(it => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="p-2">
                        <div className="font-medium text-slate-800">{it.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{it.code}</div>
                      </td>
                      <td className="p-2 text-right font-bold text-rose-600">
                        {formatNumber(it.current_stock)} {it.unit}
                      </td>
                      <td className="p-2 text-right text-slate-600">
                        {formatNumber(it.min_stock)} {it.unit}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => onNavigate('orders')}
                          className="text-xs text-blue-700 hover:underline font-semibold"
                        >
                          Lập đơn mua
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Giao dịch kho mới nhất */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Phiếu nhập / xuất kho mới nhất
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-blue-700 hover:underline font-medium"
            >
              Xem tất cả
            </button>
          </div>
          <div className="p-4">
            {recentTransactions.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-6">Chưa có giao dịch kho nào.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-2">Số phiếu</th>
                    <th className="p-2">Loại</th>
                    <th className="p-2">Kho</th>
                    <th className="p-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-xs font-bold text-blue-700">
                        {tx.code}
                        <div className="text-slate-400 font-normal">{new Date(tx.date).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td className="p-2 text-xs">
                        {tx.type === 'IN_PURCHASE' && 'Nhập mua hàng'}
                        {tx.type === 'TRANSFER' && 'Xuất chuyển kho / SX'}
                        {tx.type === 'IN_PRODUCTION' && 'Nhập hoàn thành SX'}
                        {tx.type === 'OUT_SALE' && 'Xuất bán hàng'}
                        {tx.type === 'OUT_PRODUCTION' && 'Xuất cho phân xưởng'}
                      </td>
                      <td className="p-2 text-xs text-slate-600">
                        {tx.source_wh ? `${tx.source_wh} → ` : ''}
                        <strong>{tx.dest_wh || 'Xuất ngoài'}</strong>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          tx.status === 'POSTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {tx.status === 'POSTED' ? 'Đã ghi sổ' : 'Nháp'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
