# MINI MANUFACTURING ERP (V1.0)

Hệ thống quản lý sản xuất, kho hàng, mua bán, thu chi và giá thành dành cho xưởng sản xuất quy mô nhỏ (5 – 15 tài khoản).
Xây dựng theo đúng tài liệu phân tích kỹ thuật: `Mini_Manufacturing_ERP_Phan_Tich_Module_V1.docx`.

---

## 1. Cấu trúc Dự án (2 source riêng biệt)

- `backend/`: **Node.js + Express + MySQL (Laragon)**
  - Tích hợp kết nối trực tiếp MySQL trong Laragon qua cổng `3306`.
  - Database: `mini_manufacturing_erp`.
  - Cung cấp API RESTful cho 8 module nghiệp vụ, xác thực đăng nhập/đăng ký tài khoản và lưu trữ ma trận phân quyền trong MySQL.
  - Cổng chạy: `http://localhost:5001`

- `frontend/`: **Next.js (App Router, Turbopack) + React + Tailwind CSS**
  - Màn hình Đăng nhập / Đăng ký nhân sự xưởng chuẩn ERP.
  - Bảng ma trận phân quyền trực quan theo vai trò (Role-Based Access Control Matrix).
  - Tự động ẩn/hiện menu module theo quyền của tài khoản đang đăng nhập.
  - Cổng chạy: `http://localhost:3001` (lệnh `npm run dev`)

---

## 2. Tài khoản mẫu để kiểm tra hệ thống

Hệ thống đã chuẩn bị sẵn các tài khoản mẫu tương ứng với từng vai trò trong xưởng (có nút **Đăng nhập nhanh 1 chạm** ngay trên màn hình đăng nhập):

| Tên vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn mặc định |
| :--- | :--- | :--- | :--- |
| **Chủ xưởng / Admin** | `admin` | `admin123` | Toàn quyền tất cả các phân hệ và cấu hình ma trận quyền |
| **Quản đốc sản xuất** | `quanly` | `123456` | Toàn quyền BOM, Lệnh SX, Quản lý kho, Giá thành, Báo cáo |
| **Thủ kho chính** | `thukho` | `123456` | Tồn kho theo lô, Lập & Ghi sổ phiếu kho, Nhận/Giao hàng |
| **Tổ trưởng sản xuất** | `sanxuat` | `123456` | Xem lệnh SX, Cập nhật tiến độ công đoạn, Báo cáo hoàn thành |
| **Kế toán nội bộ** | `ketoan` | `123456` | Mua/bán hàng, Thu chi tiền tệ, Sổ quỹ, Công nợ, Quyết toán giá |

---

## 3. Ma trận Phân quyền (Role Permission Matrix)

- Được quản lý tập trung trong bảng `role_matrix` của MySQL.
- Quản trị viên có thể truy cập tab **"Ma trận phân quyền"** để bật/tắt (checkbox) quyền hạn cho từng vai trò đối với 8 module:
  1. Tổng quan điều hành (Dashboard)
  2. Danh mục (Hàng hóa, Kho, Đối tác)
  3. Kho hàng (Xem tồn kho theo lô & Lập/ghi sổ phiếu kho)
  4. BOM & Tính toán nhu cầu vật tư (MRP)
  5. Quản lý sản xuất & Cấp phát vật tư & Công đoạn
  6. Mua hàng & Bán hàng
  7. Thu chi nội bộ & Sổ quỹ & Công nợ
  8. Chi phí & Quyết toán giá thành sản phẩm
