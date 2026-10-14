import React, { useState } from 'react';
import { formatNumber } from '../api';

export default function LotLabelModal({ lotData, onClose }) {
  if (!lotData) return null;

  const lotNumber = lotData.lot_number || lotData.lotNumber || 'LOT-AUTO-01';
  const itemName = lotData.item_name || lotData.target_item_name || 'Vật tư / Sản phẩm xưởng gỗ';
  const itemCode = lotData.item_code || lotData.target_item_code || 'ITM-CODE';
  const itemUnit = lotData.item_unit || lotData.target_item_unit || 'Cái';
  const itemType = lotData.item_type || (lotData.lot_number?.includes('TP') ? 'TP' : 'NVL');
  const warehouseName = lotData.warehouse_name || 'Kho Chính';
  const qty = lotData.quantity || lotData.planned_qty || lotData.actual_qty || 1;

  const dateStr = new Date().toLocaleDateString('vi-VN');
  
  // Dữ liệu mã QR có thể quét trực tiếp bằng camera điện thoại
  const qrRawText = `TIEN_PHAT_MFG|LOT:${lotNumber}|ITEM:${itemCode}|NAME:${itemName}|DATE:${dateStr}|QC:PASSED`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrRawText)}&color=0-0-0&bgcolor=255-255-255&qzone=1`;

  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(qrRawText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none">
        
        {/* Thanh công cụ Modal (Ẩn khi in) */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Tem nhãn dán thùng hàng & Mã QR số lô
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              In tem nhãn (100x75mm)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-md transition-colors"
            >
              Đóng (Esc)
            </button>
          </div>
        </div>

        {/* Khung tem nhãn công nghiệp (In theo kích thước tem nhiệt chuẩn 100 x 75mm) */}
        <div className="p-6 bg-slate-50 print:bg-white print:p-0 flex justify-center">
          <div className="w-[420px] bg-white border-2 border-dashed border-slate-400 print:border-solid print:border-black rounded-lg p-5 shadow-sm print:shadow-none text-slate-900 font-sans space-y-3">
            
            {/* Header tem */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <div>
                <div className="text-[11px] font-black uppercase tracking-tight text-slate-900">
                  TIẾN PHÁT WOOD MFG
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  HỆ THỐNG TRUY XUẤT NGUỒN GỐC LÔ HÀNG
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-white">
                  {itemType === 'TP' ? 'Thành Phẩm' : itemType === 'BTP' ? 'Bán Thành Phẩm' : 'Nguyên Vật Liệu'}
                </span>
              </div>
            </div>

            {/* Tên hàng & Mã số */}
            <div>
              <div className="text-base font-extrabold text-slate-900 leading-tight">
                {itemName}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Mã: {itemCode}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  SL: <strong className="text-slate-900">{formatNumber(qty)} {itemUnit}</strong>
                </span>
              </div>
            </div>

            {/* Khối Mã Số Lô To Rõ Ràng */}
            <div className="bg-slate-100/90 border border-slate-300 rounded p-2 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                SỐ LÔ SẢN XUẤT / LOT NUMBER
              </div>
              <div className="text-xl font-black font-mono tracking-wider text-blue-700 print:text-black mt-0.5">
                {lotNumber}
              </div>
            </div>

            {/* Thông tin phụ & Mã QR */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200">
              <div className="space-y-1 text-[11px] text-slate-700">
                <div>
                  <span className="text-slate-500">Ngày đóng gói:</span>{' '}
                  <strong className="font-mono">{dateStr}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Kho lưu trữ:</span>{' '}
                  <span className="font-medium text-slate-900">{warehouseName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tiêu chuẩn:</span>{' '}
                  <span className="font-bold text-emerald-700 print:text-black">TCVN 8575 / ISO 9001</span>
                </div>
                
                {/* Con dấu QC Passed */}
                <div className="pt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-2 border-emerald-600 text-emerald-700 print:text-black font-extrabold text-[10px] uppercase tracking-wider bg-emerald-50 print:bg-transparent">
                    ★ QC PASSED ★
                  </span>
                </div>
              </div>

              {/* Hình ảnh QR Code (quét được ngay bằng camera điện thoại) */}
              <div className="flex flex-col items-center">
                <div className="p-1 border-2 border-slate-900 rounded bg-white shadow-2xs">
                  <img
                    src={qrCodeUrl}
                    alt={`QR Lot ${lotNumber}`}
                    className="w-24 h-24 object-contain"
                    loading="eager"
                  />
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-mono tracking-tighter">
                  SCAN FOR TRACE
                </span>
              </div>
            </div>

            {/* Mã vạch mô phỏng chân tem */}
            <div className="pt-2 border-t border-slate-200 flex flex-col items-center">
              <div className="w-full flex justify-between tracking-widest text-[12px] font-mono select-none h-5 overflow-hidden opacity-80">
                ||| | |||| | ||| |||| || | |||| ||| | ||| |||| || | |||| ||| | |||
              </div>
              <div className="text-[10px] font-mono text-slate-500 tracking-wider">
                *{lotNumber}*
              </div>
            </div>

          </div>
        </div>

        {/* Hướng dẫn demo phía dưới */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">💡 Mẹo Demo:</span>
            <span>Bạn có thể dùng camera điện thoại quét thử mã QR trên màn hình.</span>
          </div>
          <button
            type="button"
            onClick={handleCopyText}
            className="text-[11px] font-mono px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 transition-colors"
          >
            {copyFeedback ? '✓ Đã sao chép!' : 'Sao chép chuỗi mã'}
          </button>
        </div>

      </div>
    </div>
  );
}
