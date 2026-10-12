import React, { useState, useEffect } from 'react';
import { fetchApi, formatNumber } from '../api';

export default function LotTraceModal({ lotNumber, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lotNumber) return;
    const fetchTrace = async () => {
      try {
        setLoading(true);
        const res = await fetchApi(`/inventory/trace/${lotNumber}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrace();
  }, [lotNumber]);

  if (!lotNumber) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full p-6 shadow-xl space-y-5 my-8">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Truy xuất nguồn gốc số lô (Lot Traceability)
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Số lô đang tra cứu: <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{lotNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-lg px-2"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Đang truy vấn lịch sử lô hàng...</div>
        ) : !data ? (
          <div className="py-8 text-center text-sm text-slate-500">Không tìm thấy dữ liệu về số lô này.</div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* 1. Tồn kho hiện thời của lô */}
            <div>
              <h4 className="font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                1. Tồn kho hiện tại của Lô
              </h4>
              {data.currentStock?.length === 0 ? (
                <div className="text-slate-400 italic">Lô này hiện không còn tồn kho (đã xuất hết hoặc chưa nhập).</div>
              ) : (
                <table className="w-full text-left border rounded overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2">Kho</th>
                      <th className="p-2">Mã & Tên hàng</th>
                      <th className="p-2 text-right">Số lượng tồn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.currentStock.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-800">{s.warehouse_name}</td>
                        <td className="p-2">[{s.item_code}] {s.item_name}</td>
                        <td className="p-2 text-right font-bold text-blue-700">{formatNumber(s.quantity)} {s.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 2. Lô này được sản xuất từ đâu? */}
            <div>
              <h4 className="font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                2. Nguồn gốc Sản xuất (Lệnh sản xuất đầu ra của Lô)
              </h4>
              {data.producedInOrders?.length === 0 ? (
                <div className="text-slate-400 italic">Đây là lô Nguyên vật liệu mua ngoài, không phải thành phẩm từ xưởng.</div>
              ) : (
                <table className="w-full text-left border rounded overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2">Mã Lệnh SX</th>
                      <th className="p-2">Ngày SX</th>
                      <th className="p-2">Sản phẩm</th>
                      <th className="p-2 text-right">Sản lượng đạt</th>
                      <th className="p-2 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.producedInOrders.map((po, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-blue-700 font-bold">{po.code}</td>
                        <td className="p-2">{new Date(po.date).toLocaleDateString('vi-VN')}</td>
                        <td className="p-2 font-medium">{po.item_name}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">{formatNumber(po.actual_qty)}</td>
                        <td className="p-2 text-center font-semibold text-slate-700">{po.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 3. Lô này được cấp phát tiêu dùng cho Lệnh SX nào? */}
            <div>
              <h4 className="font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                3. Quá trình tiêu hao (Được dùng làm NVL/BTP cho các Lệnh SX nào)
              </h4>
              {data.consumedInOrders?.length === 0 ? (
                <div className="text-slate-400 italic">Lô này chưa được xuất tiêu dùng cho bất kỳ Lệnh sản xuất nào.</div>
              ) : (
                <table className="w-full text-left border rounded overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2">Lệnh sản xuất</th>
                      <th className="p-2">Vật tư cấp</th>
                      <th className="p-2 text-right">Kế hoạch</th>
                      <th className="p-2 text-right">Thực tế đã dùng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.consumedInOrders.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-blue-700">{c.production_order_code}</td>
                        <td className="p-2">{c.item_name}</td>
                        <td className="p-2 text-right">{formatNumber(c.planned_qty)}</td>
                        <td className="p-2 text-right font-bold text-slate-800">{formatNumber(c.actual_used_qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 4. Các chứng từ kho liên quan */}
            <div>
              <h4 className="font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                4. Lịch sử các phiếu kho liên quan đến Lô
              </h4>
              <table className="w-full text-left border rounded overflow-hidden">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-2">Mã phiếu</th>
                    <th className="p-2">Ngày</th>
                    <th className="p-2">Loại phiếu</th>
                    <th className="p-2 text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.relatedTransactions || []).map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-blue-700">{t.code}</td>
                      <td className="p-2">{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                      <td className="p-2 font-semibold text-slate-700">{t.type}</td>
                      <td className="p-2 text-right font-bold text-slate-800">{formatNumber(t.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 text-white rounded text-xs font-semibold hover:bg-slate-800"
          >
            Đóng tra cứu
          </button>
        </div>
      </div>
    </div>
  );
}
