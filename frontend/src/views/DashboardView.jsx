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
      <div className="flex items-center justify-center p-12 text-zinc-500 text-sm">
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
      {/* Top Banner Tiêu đề & Làm mới (shadcn/ui Page Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Tổng quan điều hành</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Tổng hợp thời gian thực dữ liệu kho, sản xuất, công nợ và dòng tiền
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="h-8 px-3 text-xs bg-white border border-zinc-200 text-zinc-800 rounded-md hover:bg-zinc-50 font-medium shadow-sm transition-colors"
          >
            Làm mới
          </button>
          <button
            onClick={() => onNavigate('production')}
            className="h-8 px-3 text-xs bg-zinc-900 text-white rounded-md hover:bg-zinc-800 font-medium shadow-sm transition-colors"
          >
            + Lập Lệnh SX
          </button>
        </div>
      </div>

      {/* KPI Cards (shadcn/ui Metric Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tồn kho */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Tổng giá trị tồn kho</div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">{formatMoney(totalInventoryValue)}</div>
          <div className="mt-3 text-xs text-zinc-600 flex justify-between border-t border-zinc-100 pt-2.5">
            <span>NVL: <strong className="text-zinc-900">{formatMoney(inventoryByType.NVL)}</strong></span>
            <span>BTP: <strong className="text-zinc-900">{formatMoney(inventoryByType.BTP)}</strong></span>
            <span>TP: <strong className="text-zinc-900">{formatMoney(inventoryByType.TP)}</strong></span>
          </div>
        </div>

        {/* Lệnh sản xuất */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Lệnh SX đang vận hành</div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">{activeProductionOrders} lệnh</div>
          <div className="mt-3 text-xs text-zinc-600 flex justify-between border-t border-zinc-100 pt-2.5">
            <span>Đang chạy: <strong className="text-zinc-900">{productionCount.IN_PROGRESS || 0}</strong></span>
            <span>Hoàn thành: <strong className="text-zinc-900">{productionCount.COMPLETED || 0}</strong></span>
          </div>
        </div>

        {/* Phải thu khách hàng */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Công nợ phải thu (KH)</div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">{formatMoney(debts.receivable)}</div>
          <div className="mt-3 text-xs text-zinc-600 border-t border-zinc-100 pt-2.5 flex justify-between">
            <span>Doanh số bán:</span>
            <strong className="text-zinc-900">{formatMoney(salesRevenue)}</strong>
          </div>
        </div>

        {/* Phải trả nhà cung cấp */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Công nợ phải trả (NCC)</div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">{formatMoney(debts.payable)}</div>
          <div className="mt-3 text-xs text-zinc-600 border-t border-zinc-100 pt-2.5 flex justify-between">
            <span>Tiền mua vật tư:</span>
            <strong className="text-zinc-900">{formatMoney(purchaseExpense)}</strong>
          </div>
        </div>
      </div>

      {/* Grid 2 cột: Cảnh báo tồn kho + Giao dịch kho gần đây (shadcn/ui Table Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cảnh báo mức tồn tối thiểu */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
              Cảnh báo tồn kho dưới mức tối thiểu
            </h3>
            <span className="text-[11px] px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full font-medium">
              {lowStockAlerts.length} mặt hàng
            </span>
          </div>
          <div className="p-0">
            {lowStockAlerts.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-8">
                Tất cả mặt hàng đều đạt hoặc vượt định mức tồn an toàn.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Mã & Tên hàng</th>
                    <th className="py-2.5 px-4 text-right">Tồn hiện có</th>
                    <th className="py-2.5 px-4 text-right">Tối thiểu</th>
                    <th className="py-2.5 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {lowStockAlerts.map(it => (
                    <tr key={it.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-zinc-900">{it.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{it.code}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-red-600">
                        {formatNumber(it.current_stock)} {it.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right text-zinc-600">
                        {formatNumber(it.min_stock)} {it.unit}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => onNavigate('orders')}
                          className="text-xs text-zinc-900 hover:underline font-medium"
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
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
              Phiếu nhập / xuất kho mới nhất
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-zinc-600 hover:text-zinc-950 font-medium hover:underline"
            >
              Xem tất cả
            </button>
          </div>
          <div className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-8">Chưa có giao dịch kho nào.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Số phiếu</th>
                    <th className="py-2.5 px-4">Loại phiếu</th>
                    <th className="py-2.5 px-4">Kho</th>
                    <th className="py-2.5 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {recentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-zinc-900">
                        {tx.code}
                        <div className="text-[10px] text-zinc-400 font-normal">{new Date(tx.date).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-700">
                        {tx.type === 'IN_PURCHASE' && 'Nhập mua hàng'}
                        {tx.type === 'TRANSFER' && 'Xuất chuyển kho / SX'}
                        {tx.type === 'IN_PRODUCTION' && 'Nhập hoàn thành SX'}
                        {tx.type === 'OUT_SALE' && 'Xuất bán hàng'}
                        {tx.type === 'OUT_PRODUCTION' && 'Xuất cho phân xưởng'}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-600">
                        {tx.source_wh ? `${tx.source_wh} → ` : ''}
                        <strong>{tx.dest_wh || 'Xuất ngoài'}</strong>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                          tx.status === 'POSTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
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
