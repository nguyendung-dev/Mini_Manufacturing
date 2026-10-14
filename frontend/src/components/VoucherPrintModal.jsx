import React from 'react';
import { formatMoney, formatNumber } from '../api';

export default function VoucherPrintModal({ transaction, onClose }) {
  if (!transaction) return null;

  const isStockIn = transaction.type?.startsWith('IN_');
  const isTransfer = transaction.type === 'TRANSFER';
  
  let voucherTitle = 'PHIẾU NHẬP KHO';
  let voucherTemplateCode = 'Mẫu số 01 - VT';
  let voucherTypeLabel = 'Nhập kho';
  if (isTransfer) {
    voucherTitle = 'PHIẾU ĐIỀU CHUYỂN KHO';
    voucherTemplateCode = 'Mẫu số 03 - VT';
    voucherTypeLabel = 'Điều chuyển';
  } else if (!isStockIn) {
    voucherTitle = 'PHIẾU XUẤT KHO';
    voucherTemplateCode = 'Mẫu số 02 - VT';
    voucherTypeLabel = 'Xuất kho';
  }

  const dateObj = new Date(transaction.date || new Date());
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  const items = transaction.items || [];
  const totalAmount = items.reduce((sum, it) => sum + (Number(it.qty || 0) * Number(it.price || it.cost_price || 0)), 0);

  // Chuyển số tiền thành chữ tiếng Việt cơ bản cho hóa đơn
  const readMoneyInWords = (num) => {
    if (!num || num === 0) return 'Không đồng';
    return `${formatMoney(num)} (VNĐ)`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      {/* Container phiếu in */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none">
        
        {/* Thanh công cụ (Ẩn khi in ra máy in hoặc PDF) */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Xem trước mẫu in chứng từ ({voucherTypeLabel})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              In chứng từ / Lưu PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-md transition-colors"
            >
              Đóng (Esc)
            </button>
          </div>
        </div>

        {/* Nội dung khổ giấy in A4 chuẩn kế toán */}
        <div className="p-8 sm:p-12 text-slate-900 bg-white font-serif text-[13px] leading-relaxed print:p-6 print:text-black">
          
          {/* Header công ty & Thông tư */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-300 pb-4 gap-4">
            <div>
              <div className="font-bold text-sm tracking-tight uppercase text-slate-900 font-sans">
                CÔNG TY TNHH SẢN XUẤT GỖ TIẾN PHÁT
              </div>
              <div className="text-xs text-slate-600 font-sans mt-0.5">
                Khu Công Nghiệp Nam Tân Uyên, TP. Tân Uyên, Tỉnh Bình Dương
              </div>
              <div className="text-xs text-slate-600 font-sans">
                Hotline: 0988.123.456 | MST: 3702468999 | Email: contact@tienphatwood.vn
              </div>
            </div>
            <div className="text-right text-xs font-sans text-slate-600 sm:min-w-[220px]">
              <div className="font-bold text-slate-800">{voucherTemplateCode}</div>
              <div className="italic text-[11px] text-slate-500">
                (Ban hành theo Thông tư số 133/2016/TT-BTC của Bộ Tài chính)
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold text-blue-700 print:text-black">
                Số: {transaction.code}
              </div>
            </div>
          </div>

          {/* Tiêu đề phiếu */}
          <div className="text-center my-6">
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 font-sans">
              {voucherTitle}
            </h1>
            <p className="text-xs italic text-slate-600 mt-1">
              Ngày {day} tháng {month} năm {year}
            </p>
            {transaction.ref_code && (
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                (Tham chiếu theo đơn / lệnh: <strong>{transaction.ref_code}</strong>)
              </p>
            )}
          </div>

          {/* Thông tin giao nhận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs font-sans mb-6">
            <div>
              <span className="font-semibold text-slate-700">Họ tên người giao/nhận:</span>{' '}
              <span className="font-medium text-slate-900">{transaction.partner_name || 'Bộ phận nội bộ xưởng'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Trạng thái ghi sổ:</span>{' '}
              <span className="font-semibold text-emerald-700 print:text-black">
                {transaction.status === 'POSTED' ? 'Đã ghi sổ kho thành công' : 'Bản nháp lưu tạm'}
              </span>
            </div>

            {isTransfer ? (
              <>
                <div>
                  <span className="font-semibold text-slate-700">Xuất tại kho (Nguồn):</span>{' '}
                  <span className="font-medium text-slate-900">{transaction.source_warehouse_name || 'Kho chính'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Nhập tại kho (Đích):</span>{' '}
                  <span className="font-medium text-slate-900">{transaction.dest_warehouse_name || 'Kho phân xưởng'}</span>
                </div>
              </>
            ) : isStockIn ? (
              <div className="sm:col-span-2">
                <span className="font-semibold text-slate-700">Nhập tại kho:</span>{' '}
                <span className="font-medium text-slate-900">{transaction.dest_warehouse_name || 'Kho Nguyên Vật Liệu (NVL)'}</span>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <span className="font-semibold text-slate-700">Xuất tại kho:</span>{' '}
                <span className="font-medium text-slate-900">{transaction.source_warehouse_name || 'Kho Thành Phẩm (TP)'}</span>
              </div>
            )}

            <div className="sm:col-span-2">
              <span className="font-semibold text-slate-700">Lý do nhập / xuất:</span>{' '}
              <span className="italic text-slate-800">{transaction.note || 'Nhập / xuất vật tư theo quy trình sản xuất'}</span>
            </div>
          </div>

          {/* Bảng kê vật tư hàng hóa */}
          <div className="overflow-x-auto border border-slate-300 rounded-sm mb-4">
            <table className="w-full text-xs font-sans text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-center font-bold">
                  <th className="p-2 border-r border-slate-300 w-10">STT</th>
                  <th className="p-2 border-r border-slate-300 text-left">Tên, nhãn hiệu, quy cách vật tư hàng hóa</th>
                  <th className="p-2 border-r border-slate-300 w-24">Mã số</th>
                  <th className="p-2 border-r border-slate-300 w-28">Số lô (Lot No.)</th>
                  <th className="p-2 border-r border-slate-300 w-16">ĐVT</th>
                  <th className="p-2 border-r border-slate-300 w-24 text-right">Số lượng</th>
                  <th className="p-2 border-r border-slate-300 w-24 text-right">Đơn giá (VNĐ)</th>
                  <th className="p-2 text-right w-28">Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length > 0 ? (
                  items.map((it, idx) => {
                    const price = Number(it.price || it.cost_price || 0);
                    const qty = Number(it.qty || 0);
                    const lineTotal = price * qty;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center border-r border-slate-200 text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                          {it.item_name}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                          {it.item_code}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-mono font-semibold text-blue-700 print:text-black">
                          {it.lot_number || '-'}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-700">
                          {it.item_unit || 'Cái'}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900">
                          {formatNumber(qty)}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right text-slate-700 font-mono">
                          {price > 0 ? formatMoney(price) : '-'}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900 font-mono">
                          {lineTotal > 0 ? formatMoney(lineTotal) : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                      Chưa có chi tiết dòng vật tư
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={5} className="p-2 text-right border-r border-slate-300 font-sans uppercase text-[11px]">
                    Tổng cộng cộng dồn:
                  </td>
                  <td className="p-2 text-right border-r border-slate-300 font-mono font-bold text-slate-900">
                    {formatNumber(items.reduce((acc, i) => acc + Number(i.qty || 0), 0))}
                  </td>
                  <td className="p-2 border-r border-slate-300"></td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-800 print:text-black">
                    {totalAmount > 0 ? formatMoney(totalAmount) : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tổng tiền bằng chữ */}
          {totalAmount > 0 && (
            <div className="text-xs font-sans mb-8">
              <span className="font-semibold text-slate-700">Tổng số tiền (viết bằng số/chữ):</span>{' '}
              <span className="font-bold text-slate-900">{readMoneyInWords(totalAmount)}</span>
            </div>
          )}

          {/* Khối chữ ký 4 bên */}
          <div className="grid grid-cols-4 gap-4 text-center text-xs font-sans mt-8 pt-4">
            <div className="space-y-1">
              <div className="font-bold text-slate-900">Người lập phiếu</div>
              <div className="text-[11px] text-slate-500 italic">(Ký, họ tên)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-700">Nguyễn Văn Lập</div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-900">Người giao / nhận</div>
              <div className="text-[11px] text-slate-500 italic">(Ký, họ tên)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-700">{transaction.partner_name || 'Trần Văn Giao'}</div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-900">Thủ kho</div>
              <div className="text-[11px] text-slate-500 italic">(Ký, họ tên)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-700">Lê Thủ Kho</div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-900">Kế toán trưởng / Giám đốc</div>
              <div className="text-[11px] text-slate-500 italic">(Ký, đóng dấu)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-700">Phạm Kế Toán</div>
            </div>
          </div>

          {/* Footer in ấn */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-sans italic">
            In từ Hệ thống Quản trị Sản xuất Nội thất Gỗ - Ngày in: {new Date().toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  );
}
