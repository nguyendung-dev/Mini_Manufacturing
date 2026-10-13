import React, { useState, useEffect } from 'react';
import { fetchApi, formatMoney } from '../api';
import { exportToExcel } from '../utils/excel';

export default function FinanceView() {
  const [tab, setTab] = useState('cash-flow'); // cash-flow | receipts | payments | debts
  const [cashFlow, setCashFlow] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [partners, setPartners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('receipt'); // receipt | payment

  const [form, setForm] = useState({
    code: '',
    date: new Date().toISOString().split('T')[0],
    partner_id: '',
    type: 'SALE',
    payment_method: 'BANK',
    amount: 1000000,
    ref_code: '',
    note: ''
  });

  const loadData = async () => {
    try {
      const cf = await fetchApi('/finance/cash-flow');
      setCashFlow(cf);

      const rList = await fetchApi('/finance/receipts');
      setReceipts(rList);

      const pList = await fetchApi('/finance/payments');
      setPayments(pList);

      const partList = await fetchApi('/catalog/partners');
      setPartners(partList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = modalType === 'receipt' ? '/finance/receipts' : '/finance/payments';
      await fetchApi(endpoint, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      alert(`Tạo ${modalType === 'receipt' ? 'phiếu thu' : 'phiếu chi'} thành công!`);
      setShowModal(false);
      setForm({
        code: '',
        date: new Date().toISOString().split('T')[0],
        partner_id: '',
        type: 'SALE',
        payment_method: 'BANK',
        amount: 1000000,
        ref_code: '',
        note: ''
      });
      loadData();
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleExportFinanceExcel = () => {
    if (tab === 'receipts') {
      const exportData = receipts.map((r, idx) => ({
        'STT': idx + 1,
        'Số phiếu thu': r.code,
        'Ngày thu': new Date(r.date).toLocaleDateString('vi-VN'),
        'Đối tượng nộp': r.partner_name || 'Khách vãng lai',
        'Hình thức': r.payment_method === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt',
        'Số tiền (VNĐ)': Number(r.amount),
        'Mã đơn tham chiếu': r.ref_code || '-',
        'Nội dung thu': r.note || '-'
      }));
      exportToExcel(exportData, 'So_Phieu_Thu_Tien', 'Phieu_Thu');
    } else if (tab === 'payments') {
      const exportData = payments.map((p, idx) => ({
        'STT': idx + 1,
        'Số phiếu chi': p.code,
        'Ngày chi': new Date(p.date).toLocaleDateString('vi-VN'),
        'Đối tượng nhận': p.partner_name || 'Nội bộ xưởng',
        'Khoản mục chi': p.type,
        'Hình thức': p.payment_method === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt',
        'Số tiền chi (VNĐ)': Number(p.amount),
        'Mã đơn tham chiếu': p.ref_code || '-',
        'Nội dung chi': p.note || '-'
      }));
      exportToExcel(exportData, 'So_Phieu_Chi_Tien', 'Phieu_Chi');
    } else if (tab === 'debts') {
      const exportData = partners.map((p, idx) => ({
        'STT': idx + 1,
        'Mã đối tác': p.code,
        'Tên khách hàng / NCC': p.name,
        'Phân loại': p.type === 'CUSTOMER' ? 'Khách hàng' : 'Nhà cung cấp',
        'Điện thoại': p.phone || '-',
        'Địa chỉ': p.address || '-',
        'Số dư công nợ (VNĐ)': Number(p.debt)
      }));
      exportToExcel(exportData, 'Bang_Theo_Doi_Cong_No', 'Cong_No');
    } else {
      const exportData = [
        { 'Khoản mục': 'Tiền mặt tại quỹ xưởng', 'Số tiền (VNĐ)': cashFlow?.cash?.balance || 0, 'Ghi chú': 'Tổng thu: ' + (cashFlow?.cash?.in || 0) + ' | Tổng chi: ' + (cashFlow?.cash?.out || 0) },
        { 'Khoản mục': 'Tiền gửi ngân hàng', 'Số tiền (VNĐ)': cashFlow?.bank?.balance || 0, 'Ghi chú': 'Tổng thu: ' + (cashFlow?.bank?.in || 0) + ' | Tổng chi: ' + (cashFlow?.bank?.out || 0) },
        { 'Khoản mục': 'TỔNG NGÂN QUỸ KHẢ DỤNG', 'Số tiền (VNĐ)': cashFlow?.netBalance || 0, 'Ghi chú': 'Số dư ròng thực tế' }
      ];
      exportToExcel(exportData, 'So_Quy_Dong_Tien', 'Dong_Tien');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Thu chi nội bộ & Sổ quỹ tiền mặt</h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý phiếu thu, phiếu chi tiền mặt / ngân hàng và theo dõi công nợ đối tác nhiều đợt
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportFinanceExcel}
            className="px-3.5 py-2 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 shadow-sm text-sm flex items-center gap-1.5"
            title="Xuất bảng dữ liệu hiện tại ra Excel (.xlsx)"
          >
            📊 Xuất Excel
          </button>
          <button
            onClick={() => {
              setModalType('receipt');
              setForm({
                code: '',
                date: new Date().toISOString().split('T')[0],
                partner_id: '',
                type: 'SALE',
                payment_method: 'BANK',
                amount: 1000000,
                ref_code: '',
                note: ''
              });
              setShowModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 shadow-sm text-sm"
          >
            + Lập Phiếu Thu
          </button>
          <button
            onClick={() => {
              setModalType('payment');
              setForm({
                code: '',
                date: new Date().toISOString().split('T')[0],
                partner_id: '',
                type: 'PURCHASE',
                payment_method: 'BANK',
                amount: 1000000,
                ref_code: '',
                note: ''
              });
              setShowModal(true);
            }}
            className="px-3.5 py-2 bg-rose-700 text-white rounded font-medium hover:bg-rose-800 shadow-sm text-sm"
          >
            + Lập Phiếu Chi
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setTab('cash-flow')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'cash-flow' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sổ quỹ & Dòng tiền
        </button>
        <button
          onClick={() => setTab('receipts')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'receipts' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sổ Phiếu thu ({receipts.length})
        </button>
        <button
          onClick={() => setTab('payments')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'payments' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sổ Phiếu chi ({payments.length})
        </button>
        <button
          onClick={() => setTab('debts')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'debts' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bảng theo dõi Công nợ
        </button>
      </div>

      {/* Tab Sổ quỹ */}
      {tab === 'cash-flow' && cashFlow && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tiền mặt */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tiền mặt tại quỹ xưởng</div>
              <div className="text-2xl font-bold text-slate-800 mt-2">{formatMoney(cashFlow.cash.balance)}</div>
              <div className="mt-3 text-xs text-slate-600 flex justify-between border-t pt-2">
                <span>Tổng thu: <strong className="text-emerald-700">+{formatMoney(cashFlow.cash.in)}</strong></span>
                <span>Tổng chi: <strong className="text-rose-700">-{formatMoney(cashFlow.cash.out)}</strong></span>
              </div>
            </div>

            {/* Tiền gửi ngân hàng */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tài khoản Ngân hàng</div>
              <div className="text-2xl font-bold text-blue-700 mt-2">{formatMoney(cashFlow.bank.balance)}</div>
              <div className="mt-3 text-xs text-slate-600 flex justify-between border-t pt-2">
                <span>Tổng thu: <strong className="text-emerald-700">+{formatMoney(cashFlow.bank.in)}</strong></span>
                <span>Tổng chi: <strong className="text-rose-700">-{formatMoney(cashFlow.bank.out)}</strong></span>
              </div>
            </div>

            {/* Tổng số dư ròng */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tổng ngân quỹ khả dụng</div>
              <div className={`text-2xl font-bold mt-2 ${cashFlow.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatMoney(cashFlow.netBalance)}
              </div>
              <div className="mt-3 text-xs text-slate-600 flex justify-between border-t pt-2">
                <span>Tổng thu vào: {formatMoney(cashFlow.totalIn)}</span>
                <span>Tổng chi ra: {formatMoney(cashFlow.totalOut)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Phiếu thu */}
      {tab === 'receipts' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px] whitespace-nowrap">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b">
              <tr>
                <th className="p-3">Số phiếu thu</th>
                <th className="p-3">Ngày thu</th>
                <th className="p-3">Người nộp (Khách hàng)</th>
                <th className="p-3">Hình thức</th>
                <th className="p-3 text-right">Số tiền thu</th>
                <th className="p-3">Mã đơn liên quan</th>
                <th className="p-3">Nội dung thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-bold text-emerald-700">{r.code}</td>
                  <td className="p-3 text-xs text-slate-600">{new Date(r.date).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3 font-medium text-slate-800">{r.partner_name || 'Khách vãng lai'}</td>
                  <td className="p-3 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700 border border-slate-200">
                      {r.payment_method === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-700">{formatMoney(r.amount)}</td>
                  <td className="p-3 font-mono text-xs text-slate-600 font-bold">{r.ref_code || '-'}</td>
                  <td className="p-3 text-xs text-slate-600">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Phiếu chi */}
      {tab === 'payments' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[950px] whitespace-nowrap">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b">
              <tr>
                <th className="p-3">Số phiếu chi</th>
                <th className="p-3">Ngày chi</th>
                <th className="p-3">Người nhận / Đối tác</th>
                <th className="p-3">Khoản mục chi</th>
                <th className="p-3">Hình thức</th>
                <th className="p-3 text-right">Số tiền chi</th>
                <th className="p-3">Mã đơn mua / Chứng từ</th>
                <th className="p-3">Nội dung chi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-bold text-rose-700">{p.code}</td>
                  <td className="p-3 text-xs text-slate-600">{new Date(p.date).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3 font-medium text-slate-800">{p.partner_name || 'Nội bộ xưởng'}</td>
                  <td className="p-3 text-xs font-semibold text-slate-700">
                    {p.type === 'PURCHASE' ? 'Mua hàng NVL' : p.type === 'OVERHEAD' ? 'Chi phí chung' : 'Lương / Khác'}
                  </td>
                  <td className="p-3 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700 border border-slate-200">
                      {p.payment_method === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-rose-700">-{formatMoney(p.amount)}</td>
                  <td className="p-3 font-mono text-xs text-slate-600 font-bold">{p.ref_code || '-'}</td>
                  <td className="p-3 text-xs text-slate-600">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Bảng theo dõi công nợ */}
      {tab === 'debts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Phải thu KH */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Công nợ Phải thu Khách hàng</h3>
              <span className="text-xs font-bold text-emerald-700">
                Tổng: {formatMoney(partners.filter(p => p.type === 'CUSTOMER').reduce((s, p) => s + Number(p.debt || 0), 0))}
              </span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">Mã KH</th>
                  <th className="p-2.5">Tên khách hàng</th>
                  <th className="p-2.5">Điện thoại</th>
                  <th className="p-2.5 text-right">Số dư nợ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partners.filter(p => p.type === 'CUSTOMER').map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-blue-700 font-bold">{c.code}</td>
                    <td className="p-2.5 font-medium text-slate-800">{c.name}</td>
                    <td className="p-2.5 text-slate-500 font-mono">{c.phone}</td>
                    <td className={`p-2.5 text-right font-bold ${c.debt > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {formatMoney(c.debt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phải trả NCC */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Công nợ Phải trả Nhà cung cấp</h3>
              <span className="text-xs font-bold text-rose-700">
                Tổng: {formatMoney(partners.filter(p => p.type === 'SUPPLIER').reduce((s, p) => s + Number(p.debt || 0), 0))}
              </span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-2.5">Mã NCC</th>
                  <th className="p-2.5">Tên nhà cung cấp</th>
                  <th className="p-2.5">Điện thoại</th>
                  <th className="p-2.5 text-right">Số dư nợ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partners.filter(p => p.type === 'SUPPLIER').map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-blue-700 font-bold">{s.code}</td>
                    <td className="p-2.5 font-medium text-slate-800">{s.name}</td>
                    <td className="p-2.5 text-slate-500 font-mono">{s.phone}</td>
                    <td className={`p-2.5 text-right font-bold ${s.debt > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                      {formatMoney(s.debt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Lập Phiếu Thu / Chi */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
              Lập {modalType === 'receipt' ? 'Phiếu Thu Tiền' : 'Phiếu Chi Tiền'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày chứng từ (*)</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phương thức (*)</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none font-medium"
                  >
                    <option value="BANK">Tài khoản Ngân hàng</option>
                    <option value="CASH">Tiền mặt tại quỹ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {modalType === 'receipt' ? 'Khách hàng nộp' : 'Nhà cung cấp / Đối tượng nhận'}
                </label>
                <select
                  value={form.partner_id}
                  onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
                  className="w-full text-sm border p-2 rounded focus:outline-none"
                >
                  <option value="">-- {modalType === 'receipt' ? 'Khách vãng lai / Khác' : 'Nội bộ / Khác'} --</option>
                  {partners
                    .filter(p => modalType === 'receipt' ? p.type === 'CUSTOMER' : true)
                    .map(p => (
                      <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền (* VNĐ)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full text-sm border p-2 rounded focus:outline-none font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mã đơn liên quan</label>
                  <input
                    type="text"
                    placeholder="VD: SO-01 hoặc PO-01"
                    value={form.ref_code}
                    onChange={(e) => setForm({ ...form, ref_code: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Diễn giải nội dung</label>
                <input
                  type="text"
                  placeholder="Ghi chú chi tiết lý do thu/chi..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full text-sm border p-2 rounded focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded text-sm font-semibold ${
                    modalType === 'receipt' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  Lưu {modalType === 'receipt' ? 'Phiếu Thu' : 'Phiếu Chi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
