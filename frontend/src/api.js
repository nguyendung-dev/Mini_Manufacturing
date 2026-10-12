const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Có lỗi xảy ra khi gọi máy chủ');
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const formatMoney = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0';
  const val = Number(num);
  return Number.isInteger(val) ? val.toLocaleString('vi-VN') : val.toLocaleString('vi-VN', { maximumFractionDigits: decimals });
};
