import React, { useState, useEffect } from 'react';
import { fetchApi, formatMoney, formatNumber } from '../api';

export default function CatalogView() {
  const [tab, setTab] = useState('items'); // items | warehouses | partners
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [partners, setPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    code: '',
    name: '',
    type: 'NVL',
    category_id: '',
    unit: 'Kg',
    cost_price: 0,
    sale_price: 0,
    min_stock: 0
  });

  const [partnerForm, setPartnerForm] = useState({
    code: '',
    name: '',
    type: 'CUSTOMER',
    phone: '',
    address: '',
    debt: 0
  });

  const [whForm, setWhForm] = useState({
    code: '',
    name: '',
    type: 'NVL',
    location: ''
  });

  const loadData = async () => {
    try {
      if (tab === 'items') {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        if (typeFilter) query.append('type', typeFilter);
        const res = await fetchApi(`/catalog/items?${query.toString()}`);
        setItems(res);
        const cats = await fetchApi('/catalog/categories');
        setCategories(cats);
      } else if (tab === 'warehouses') {
        const res = await fetchApi('/catalog/warehouses');
        setWarehouses(res);
      } else if (tab === 'partners') {
        const query = typeFilter ? `?type=${typeFilter}` : '';
        const res = await fetchApi(`/catalog/partners${query}`);
        setPartners(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab, search, typeFilter]);

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/catalog/items/${editingId}` : '/catalog/items';
      const method = editingId ? 'PUT' : 'POST';
      await fetchApi(endpoint, {
        method,
        body: JSON.stringify(itemForm)
      });
      setShowModal(false);
      setEditingId(null);
      setItemForm({ code: '', name: '', type: 'NVL', category_id: '', unit: 'Kg', cost_price: 0, sale_price: 0, min_stock: 0 });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditItem = (it) => {
    setEditingId(it.id);
    setItemForm({
      code: it.code,
      name: it.name,
      type: it.type,
      category_id: it.category_id || '',
      unit: it.unit,
      cost_price: it.cost_price || 0,
      sale_price: it.sale_price || 0,
      min_stock: it.min_stock || 0
    });
    setShowModal(true);
  };

  const handleDeleteItem = async (it) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mặt hàng "${it.name}" (${it.code}) không?`)) return;
    try {
      await fetchApi(`/catalog/items/${it.id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSavePartner = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/catalog/partners/${editingId}` : '/catalog/partners';
      const method = editingId ? 'PUT' : 'POST';
      await fetchApi(endpoint, {
        method,
        body: JSON.stringify(partnerForm)
      });
      setShowModal(false);
      setEditingId(null);
      setPartnerForm({ code: '', name: '', type: 'CUSTOMER', phone: '', address: '', debt: 0 });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditPartner = (p) => {
    setEditingId(p.id);
    setPartnerForm({
      code: p.code,
      name: p.name,
      type: p.type,
      phone: p.phone || '',
      address: p.address || '',
      debt: p.debt || 0
    });
    setShowModal(true);
  };

  const handleDeletePartner = async (p) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đối tác "${p.name}" (${p.code}) không?`)) return;
    try {
      await fetchApi(`/catalog/partners/${p.id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/catalog/warehouses/${editingId}` : '/catalog/warehouses';
      const method = editingId ? 'PUT' : 'POST';
      await fetchApi(endpoint, {
        method,
        body: JSON.stringify(whForm)
      });
      setShowModal(false);
      setEditingId(null);
      setWhForm({ code: '', name: '', type: 'NVL', location: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditWarehouse = (w) => {
    setEditingId(w.id);
    setWhForm({
      code: w.code,
      name: w.name,
      type: w.type,
      location: w.location || ''
    });
    setShowModal(true);
  };

  const handleDeleteWarehouse = async (w) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kho "${w.name}" (${w.code}) không?`)) return;
    try {
      await fetchApi(`/catalog/warehouses/${w.id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Module 01: Danh mục & Hệ thống</h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý hàng hóa, kho bãi và danh sách khách hàng, nhà cung cấp</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setItemForm({ code: '', name: '', type: 'NVL', category_id: '', unit: 'Cái', cost_price: 0, sale_price: 0, min_stock: 0 });
            setPartnerForm({ code: '', name: '', type: 'CUSTOMER', phone: '', address: '', debt: 0 });
            setWhForm({ code: '', name: '', type: 'NVL', location: '' });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-700 text-white rounded font-medium hover:bg-blue-800 shadow-sm text-sm"
        >
          + Thêm mới {tab === 'items' ? 'mặt hàng' : tab === 'warehouses' ? 'kho bãi' : 'đối tác'}
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => { setTab('items'); setTypeFilter(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'items' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hàng hóa (NVL, BTP, TP)
        </button>
        <button
          onClick={() => { setTab('warehouses'); setTypeFilter(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'warehouses' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hệ thống Kho bãi
        </button>
        <button
          onClick={() => { setTab('partners'); setTypeFilter(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'partners' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Khách hàng & Nhà cung cấp
        </button>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-600"
          />
        </div>
        {tab === 'items' && (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500 font-medium">Phân loại:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="NVL">Nguyên vật liệu (NVL)</option>
              <option value="BTP">Bán thành phẩm (BTP)</option>
              <option value="TP">Thành phẩm (TP)</option>
            </select>
          </div>
        )}
        {tab === 'partners' && (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500 font-medium">Loại đối tác:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="CUSTOMER">Khách hàng</option>
              <option value="SUPPLIER">Nhà cung cấp</option>
            </select>
          </div>
        )}
      </div>

      {/* Bảng dữ liệu Hàng hóa */}
      {tab === 'items' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Mã hàng</th>
                <th className="p-3">Tên hàng hóa</th>
                <th className="p-3">Phân loại</th>
                <th className="p-3">ĐVT</th>
                <th className="p-3 text-right">Giá vốn (kế hoạch)</th>
                <th className="p-3 text-right">Giá bán</th>
                <th className="p-3 text-right">Tồn tối thiểu</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(it => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-bold text-blue-700">{it.code}</td>
                  <td className="p-3 font-medium text-slate-800">{it.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      it.type === 'NVL' ? 'bg-amber-100 text-amber-800' :
                      it.type === 'BTP' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {it.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{it.unit}</td>
                  <td className="p-3 text-right font-medium">{formatMoney(it.cost_price)}</td>
                  <td className="p-3 text-right font-medium">{it.sale_price > 0 ? formatMoney(it.sale_price) : '-'}</td>
                  <td className="p-3 text-right text-slate-600">{formatNumber(it.min_stock)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleEditItem(it)}
                        className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                        title="Sửa mặt hàng"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(it)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                        title="Xóa mặt hàng"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bảng dữ liệu Kho */}
      {tab === 'warehouses' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Mã kho</th>
                <th className="p-3">Tên kho</th>
                <th className="p-3">Loại kho</th>
                <th className="p-3">Vị trí thực tế</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warehouses.map(w => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-bold text-blue-700">{w.code}</td>
                  <td className="p-3 font-medium text-slate-800">{w.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                      {w.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{w.location || '-'}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleEditWarehouse(w)}
                        className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                        title="Sửa kho"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteWarehouse(w)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                        title="Xóa kho"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bảng dữ liệu Đối tác */}
      {tab === 'partners' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Mã đối tác</th>
                <th className="p-3">Tên khách hàng / Nhà cung cấp</th>
                <th className="p-3">Phân loại</th>
                <th className="p-3">Điện thoại</th>
                <th className="p-3">Địa chỉ</th>
                <th className="p-3 text-right">Số dư công nợ</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs font-bold text-blue-700">{p.code}</td>
                  <td className="p-3 font-medium text-slate-800">{p.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      p.type === 'CUSTOMER' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {p.type === 'CUSTOMER' ? 'Khách hàng' : 'Nhà cung cấp'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-mono text-xs">{p.phone}</td>
                  <td className="p-3 text-slate-600">{p.address}</td>
                  <td className={`p-3 text-right font-bold ${p.debt > 0 ? (p.type === 'CUSTOMER' ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-500'}`}>
                    {formatMoney(p.debt)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleEditPartner(p)}
                        className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                        title="Sửa đối tác"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeletePartner(p)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                        title="Xóa đối tác"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Thêm mới / Cập nhật */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
              {editingId ? 'Chỉnh sửa' : 'Thêm mới'} {tab === 'items' ? 'mặt hàng' : tab === 'warehouses' ? 'kho bãi' : 'đối tác'}
            </h3>

            {tab === 'items' && (
              <form onSubmit={handleSaveItem} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mã hàng (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: NVL-THEP-01"
                      value={itemForm.code}
                      onChange={e => setItemForm({ ...itemForm, code: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phân loại (*)</label>
                    <select
                      value={itemForm.type}
                      onChange={e => setItemForm({ ...itemForm, type: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    >
                      <option value="NVL">Nguyên vật liệu (NVL)</option>
                      <option value="BTP">Bán thành phẩm (BTP)</option>
                      <option value="TP">Thành phẩm (TP)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tên hàng hóa (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Thép tấm cán nóng SS400"
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn vị tính (*)</label>
                    <input
                      type="text"
                      required
                      value={itemForm.unit}
                      onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Giá vốn kế hoạch</label>
                    <input
                      type="number"
                      value={itemForm.cost_price}
                      onChange={e => setItemForm({ ...itemForm, cost_price: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tồn tối thiểu</label>
                    <input
                      type="number"
                      value={itemForm.min_stock}
                      onChange={e => setItemForm({ ...itemForm, min_stock: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800"
                  >
                    {editingId ? 'Cập nhật mặt hàng' : 'Lưu mặt hàng'}
                  </button>
                </div>
              </form>
            )}

            {tab === 'partners' && (
              <form onSubmit={handleSavePartner} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mã đối tác (*)</label>
                    <input
                      type="text"
                      required
                      value={partnerForm.code}
                      onChange={e => setPartnerForm({ ...partnerForm, code: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Loại đối tác (*)</label>
                    <select
                      value={partnerForm.type}
                      onChange={e => setPartnerForm({ ...partnerForm, type: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    >
                      <option value="CUSTOMER">Khách hàng</option>
                      <option value="SUPPLIER">Nhà cung cấp</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tên công ty / khách hàng (*)</label>
                  <input
                    type="text"
                    required
                    value={partnerForm.name}
                    onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Điện thoại</label>
                    <input
                      type="text"
                      value={partnerForm.phone}
                      onChange={e => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      value={partnerForm.address}
                      onChange={e => setPartnerForm({ ...partnerForm, address: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    />
                  </div>
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
                    className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800"
                  >
                    {editingId ? 'Cập nhật đối tác' : 'Lưu đối tác'}
                  </button>
                </div>
              </form>
            )}

            {tab === 'warehouses' && (
              <form onSubmit={handleSaveWarehouse} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mã kho (*)</label>
                    <input
                      type="text"
                      required
                      value={whForm.code}
                      onChange={e => setWhForm({ ...whForm, code: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Loại kho (*)</label>
                    <select
                      value={whForm.type}
                      onChange={e => setWhForm({ ...whForm, type: e.target.value })}
                      className="w-full text-sm border p-2 rounded focus:outline-none"
                    >
                      <option value="NVL">Kho Nguyên vật liệu</option>
                      <option value="BTP">Kho Bán thành phẩm</option>
                      <option value="TP">Kho Thành phẩm</option>
                      <option value="SX">Kho Đệm Sản xuất</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tên kho (*)</label>
                  <input
                    type="text"
                    required
                    value={whForm.name}
                    onChange={e => setWhForm({ ...whForm, name: e.target.value })}
                    className="w-full text-sm border p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Vị trí</label>
                  <input
                    type="text"
                    value={whForm.location}
                    onChange={e => setWhForm({ ...whForm, location: e.target.value })}
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
                    className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800"
                  >
                    {editingId ? 'Cập nhật kho' : 'Lưu kho'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
