import * as XLSX from 'xlsx';

/**
 * Xuất dữ liệu mảng ra file Excel (.xlsx) chuẩn
 * @param {Array} data Mảng các object cần xuất
 * @param {String} fileName Tên file xuất ra (chưa kèm đuôi .xlsx)
 * @param {String} sheetName Tên sheet
 */
export function exportToExcel(data, fileName = 'Bao_Cao', sheetName = 'Du_Lieu') {
  if (!data || data.length === 0) {
    alert('Không có dữ liệu để xuất Excel!');
    return;
  }

  // Tạo worksheet từ mảng JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Tự động tính độ rộng cột (col widths)
  const colWidths = Object.keys(data[0] || {}).map(key => {
    let maxLen = key.length;
    data.forEach(row => {
      const val = row[key] ? String(row[key]) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
  worksheet['!cols'] = colWidths;

  // Tạo workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Xuất file và tải về
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}_${dateStr}.xlsx`);
}
