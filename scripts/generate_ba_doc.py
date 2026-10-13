# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_borders(cell, color="CCCCCC", sz="4", val="single"):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)

def style_table_header(row, col_colors=None, bg_color="1E293B"):
    for cell in row.cells:
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=150, right=150)
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.name = "Arial"

def style_table_rows(table, zebra=True):
    for i, row in enumerate(table.rows[1:]):
        bg = "F8FAFC" if (zebra and i % 2 == 1) else "FFFFFF"
        for cell in row.cells:
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            set_cell_borders(cell, color="E2E8F0", sz="4", val="single")
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(9)
                    run.font.name = "Arial"
                    run.font.color.rgb = RGBColor(30, 41, 59)

def create_document():
    doc = docx.Document()

    # Set page margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Palette
    COLOR_PRIMARY = RGBColor(15, 23, 42)    # Slate 900
    COLOR_SECONDARY = RGBColor(30, 58, 138) # Blue 900
    COLOR_TEXT = RGBColor(51, 65, 85)       # Slate 700
    COLOR_MUTED = RGBColor(100, 116, 139)   # Slate 500

    # ==================== COVER PAGE ====================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(40)
    title_p.paragraph_format.space_after = Pt(8)
    run_tag = title_p.add_run("TÀI LIỆU KỸ THUẬT & QUY TRÌNH NGHIỆP VỤ")
    run_tag.font.name = "Arial"
    run_tag.font.size = Pt(11)
    run_tag.font.bold = True
    run_tag.font.color.rgb = RGBColor(37, 99, 235) # Blue 600

    main_title = doc.add_paragraph()
    main_title.paragraph_format.space_before = Pt(4)
    main_title.paragraph_format.space_after = Pt(12)
    run_title = main_title.add_run("HỆ THỐNG QUẢN LÝ SẢN XUẤT XƯỞNG GỖ\n(MINI MANUFACTURING ERP)")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(28)
    run_sub = sub_p.add_run("Hướng Dẫn Khởi Tạo Database Từ Đầu & Tài Liệu Nghiệp Vụ Vận Hành Cho Business Analyst (BA)")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = COLOR_TEXT

    # Meta Table
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_data = [
        ("Dự án", "Hệ thống Quản lý Sản xuất & Kho Xưởng Gỗ Nội thất"),
        ("Đối tượng sử dụng", "Business Analyst (BA), Technical Lead, QA / Test Lead, Developers"),
        ("Môi trường Database", "MySQL 8.0+ / MariaDB (Chuẩn utf8mb4_unicode_ci)"),
        ("Công nghệ Backend/Frontend", "Node.js (Express, mysql2 pool) + Next.js / React (Tailwind CSS, shadcn/ui)"),
        ("Phiên bản tài liệu", "1.0 - Chính thức ban hành"),
        ("Ngày lập tài liệu", "13/10/2026")
    ]

    for idx, (label, val) in enumerate(meta_data):
        row = meta_table.rows[idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        cell_lbl.width = Inches(2.2)
        cell_val.width = Inches(4.5)
        
        p1 = cell_lbl.paragraphs[0]
        r1 = p1.add_run(label)
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_PRIMARY
        
        p2 = cell_val.paragraphs[0]
        r2 = p2.add_run(val)
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = COLOR_TEXT

        set_cell_background(cell_lbl, "F1F5F9")
        set_cell_background(cell_val, "FFFFFF")
        set_cell_margins(cell_lbl, top=80, bottom=80, left=120, right=120)
        set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)
        set_cell_borders(cell_lbl, color="CBD5E1")
        set_cell_borders(cell_val, color="CBD5E1")

    doc.add_page_break()

    # ==================== TABLE OF CONTENTS ====================
    h1_toc = doc.add_heading("MỤC LỤC TÀI LIỆU", level=1)
    h1_toc.paragraph_format.space_before = Pt(12)
    h1_toc.paragraph_format.space_after = Pt(12)
    
    toc_items = [
        "PHẦN 1: TỔNG QUAN KIẾN TRÚC HỆ THỐNG & ĐẶC THÙ NGÀNH MỘC",
        "PHẦN 2: HƯỚNG DẪN KHỞI TẠO CƠ SỞ DỮ LIỆU TỪ ĐẦU (DATABASE SETUP)",
        "    2.1. Cấu hình thông số kết nối Database (.env)",
        "    2.2. Phương pháp 1: Khởi tạo và nạp dữ liệu mẫu tự động bằng Script Node.js",
        "    2.3. Phương pháp 2: Script SQL DDL thuần túy (Chạy trên DBeaver / phpMyAdmin)",
        "PHẦN 3: TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATA DICTIONARY - 12 BẢNG CỐT LÕI)",
        "PHẦN 4: MA TRẬN QUY TRÌNH NGHIỆP VỤ ĐẦU - CUỐI (END-TO-END WORKFLOWS)",
        "    4.1. Quy trình 1: Quản lý Danh mục & Quản trị Tồn kho theo Số Lô (Lot Tracking)",
        "    4.2. Quy trình 2: Lập Định mức BOM & Tính toán Nhu cầu Vật tư Kế hoạch (MRP)",
        "    4.3. Quy trình 3: Nhập mua Vật tư & Tính năng Nhập kho 1-Click từ MRP",
        "    4.4. Quy trình 4: Quản lý Đơn hàng Bán (Sales Order) & Lập Kế hoạch SX",
        "    4.5. Quy trình 5: Điều hành Lệnh Sản Xuất (LSX) qua 4 Công đoạn Xưởng Mộc",
        "    4.6. Quy trình 6: Xuất kho Vật tư theo Định mức & Nghiệm thu Nhập kho BTP/TP",
        "    4.7. Quy trình 7: Giao hàng cho Khách & Trừ Kho Tự Động",
        "    4.8. Quy trình 8: Tính toán Giá thành Sản xuất Thực tế (Costing) & Phân tích Lệch chuẩn",
        "    4.9. Quy trình 9: Quản trị Tài chính, Thu Chi & Đối trừ Công nợ",
        "PHẦN 5: CÁC QUY TẮC NGHIỆP VỤ QUAN TRỌNG (BUSINESS RULES CHO BA)",
        "PHẦN 6: KỊCH BẢN THỬ NGHIỆM END-TO-END (TEST SCENARIO)"
    ]

    for item in toc_items:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(item)
        run.font.size = Pt(10)
        run.font.name = "Arial"
        if not item.startswith("    "):
            run.font.bold = True
            run.font.color.rgb = COLOR_SECONDARY
        else:
            run.font.color.rgb = COLOR_TEXT

    doc.add_page_break()

    # ==================== PHẦN 1: TỔNG QUAN KIẾN TRÚC ====================
    h1 = doc.add_heading("PHẦN 1: TỔNG QUAN KIẾN TRÚC HỆ THỐNG & ĐẶC THÙ NGÀNH MỘC", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "Hệ thống Mini Manufacturing ERP được thiết kế may đo đặc thù cho các xưởng mộc, nhà máy sản xuất "
        "đồ gỗ nội thất và thi công công trình dân dụng. Khác với các hệ thống ERP bán lẻ hoặc thương mại thông thường, "
        "hệ thống giải quyết 5 bài toán nghiệp vụ sản xuất cốt lõi:"
    )
    p.runs[0].font.size = Pt(10)

    bullets = [
        ("Quản lý Số lô (Lot / Batch Tracking): ", "Gỗ nguyên liệu (gỗ sồi, tần bì, óc chó, ván MDF/HDF) có độ ẩm, nguồn gốc xẻ sấy khác nhau theo từng đợt nhập. Việc truy xuất theo Số Lô giúp xưởng kiểm soát chặt chẽ chất lượng và bảo hành sản phẩm."),
        ("Định mức nguyên vật liệu (BOM) & Hao hụt (Scrap Rate %): ", "Ngành mộc luôn có tỷ lệ hao hụt mùn cưa, vát biên, mẩu vụn (dao động từ 5% - 15%). BOM hỗ trợ khai báo tỷ lệ hao hụt để hệ thống tính chính xác tổng nhu cầu vật tư cần mua."),
        ("Tính toán Nhu cầu Vật tư Kế hoạch (MRP Kế hoạch): ", "Khi có đơn hàng bán hoặc kế hoạch đóng sản phẩm, chỉ cần nhập số lượng cần sản xuất, hệ thống tự động bóc tách định mức, đối chiếu tồn kho khả dụng hiện hữu và cảnh báo lượng vật tư thiếu."),
        ("4 Công đoạn sản xuất tuần tự chuẩn xưởng mộc: ", "Theo dõi tiến độ đơn hàng qua 4 bước: (1) Cắt xẻ phôi gỗ thô -> (2) Gia công định hình & Lắp ráp kết cấu -> (3) Xử lý chà nhám & Sơn lót/Sơn bóng PU -> (4) Lắp ráp phụ kiện kim khí & Đóng gói."),
        ("Tính giá thành sản xuất thực tế (3 yếu tố 621, 622, 627): ", "Tổng hợp chi phí vật tư xuất dùng thực tế, chi phí nhân công trực tiếp xưởng và chi phí phân bổ sản xuất chung để tính ra giá thành đơn vị thành phẩm, so sánh chênh lệch (variance) so với định mức BOM chuẩn.")
    ]

    for b_title, b_desc in bullets:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(4)
        r_bt = bp.add_run(b_title)
        r_bt.font.bold = True
        r_bt.font.size = Pt(9.5)
        r_bt.font.color.rgb = COLOR_PRIMARY
        r_bd = bp.add_run(b_desc)
        r_bd.font.size = Pt(9.5)
        r_bd.font.color.rgb = COLOR_TEXT

    # ==================== PHẦN 2: HƯỚNG DẪN KHỞI TẠO DATABASE ====================
    h2 = doc.add_heading("PHẦN 2: HƯỚNG DẪN KHỞI TẠO CƠ SỞ DỮ LIỆU TỪ ĐẦU (DATABASE SETUP)", level=1)
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(8)

    p = doc.add_paragraph(
        "Hệ thống sử dụng cơ sở dữ liệu quan hệ MySQL phiên bản 8.0 trở lên (hoặc MariaDB 10.5+). "
        "BA và Đội ngũ Kỹ thuật có thể khởi tạo database theo một trong hai cách dưới đây:"
    )
    p.runs[0].font.size = Pt(10)

    # 2.1 Cấu hình
    h2_1 = doc.add_heading("2.1. Cấu hình thông số kết nối Database (.env)", level=2)
    h2_1.paragraph_format.space_before = Pt(10)
    h2_1.paragraph_format.space_after = Pt(4)

    p_env = doc.add_paragraph(
        "Tạo hoặc kiểm tra file .env tại thư mục gốc backend/ với nội dung sau:"
    )
    p_env.runs[0].font.size = Pt(9.5)

    code_env = (
        "PORT=5001\n"
        "DB_HOST=127.0.0.1\n"
        "DB_PORT=3306\n"
        "DB_USER=root\n"
        "DB_PASSWORD=\n"
        "DB_NAME=mini_manufacturing_erp\n"
        "JWT_SECRET=super_secret_jwt_key_woodworking_erp_2026"
    )
    p_code = doc.add_paragraph()
    p_code.paragraph_format.left_indent = Inches(0.2)
    p_code.paragraph_format.space_after = Pt(8)
    r_code = p_code.add_run(code_env)
    r_code.font.name = "Consolas"
    r_code.font.size = Pt(8.5)
    r_code.font.color.rgb = RGBColor(30, 41, 59)

    # 2.2 Phương pháp 1: Node.js Script
    h2_2 = doc.add_heading("2.2. Phương pháp 1: Khởi tạo và nạp dữ liệu mẫu tự động bằng Node.js Script", level=2)
    h2_2.paragraph_format.space_before = Pt(10)
    h2_2.paragraph_format.space_after = Pt(4)

    p_m1 = doc.add_paragraph(
        "Hệ thống đã tích hợp sẵn script tự động kiểm tra, tạo Schema, tạo 12 bảng và nạp đầy đủ dữ liệu "
        "danh mục xưởng gỗ chuẩn (Gỗ sồi, Ván MDF chống ẩm, Sơn PU Đại Kiều, Keo Titebond, Bản lề Hafele, Bàn Giám đốc, Tủ quần áo).\n"
        "Thao tác chạy lệnh tại terminal:"
    )
    p_m1.runs[0].font.size = Pt(9.5)

    cmd_p = doc.add_paragraph()
    cmd_p.paragraph_format.left_indent = Inches(0.2)
    r_cmd = cmd_p.add_run("cd backend\nnode src/init-db.js")
    r_cmd.font.name = "Consolas"
    r_cmd.font.size = Pt(9)
    r_cmd.font.bold = True
    r_cmd.font.color.rgb = RGBColor(16, 185, 129)

    res_p = doc.add_paragraph(
        "Khi thực thi thành công, console sẽ hiển thị:\n"
        "   > Connecting to MySQL...\n"
        "   > Database \"mini_manufacturing_erp\" checked/created.\n"
        "   > Creating tables...\n"
        "   > Tables initialized. Checking seed data...\n"
        "   > Seeding initial Woodworking & Furniture ERP data...\n"
        "   > Database initialization & Woodworking seed data completed successfully!"
    )
    res_p.runs[0].font.size = Pt(8.5)
    res_p.runs[0].font.name = "Consolas"
    res_p.runs[0].font.color.rgb = COLOR_MUTED

    # 2.3 Phương pháp 2: SQL Script thuần DDL
    h2_3 = doc.add_heading("2.3. Phương pháp 2: Chạy trực tiếp Script SQL DDL (Dành cho BA dùng DBeaver / Navicat)", level=2)
    h2_3.paragraph_format.space_before = Pt(12)
    h2_3.paragraph_format.space_after = Pt(4)

    p_m2 = doc.add_paragraph(
        "Nếu BA muốn tạo database thủ công trong các công cụ quản trị CSDL (như DBeaver, phpMyAdmin, MySQL Workbench), "
        "có thể copy toàn bộ đoạn mã SQL DDL chuẩn hóa dưới đây để chạy một lần:"
    )
    p_m2.runs[0].font.size = Pt(9.5)

    sql_ddl = """-- ==========================================================
-- SCRIPT KHỞI TẠO DATABASE MINI MANUFACTURING ERP (XƯỞNG GỖ)
-- ==========================================================
CREATE DATABASE IF NOT EXISTS `mini_manufacturing_erp` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `mini_manufacturing_erp`;

-- 1. Bảng Nhóm phân loại danh mục
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'NVL | BTP | TP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Bảng Danh mục Kho
CREATE TABLE IF NOT EXISTS warehouses (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'RAW (Kho NVL) | SEMI (Kho BTP) | FINISHED (Kho TP)',
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Bảng Hàng hóa / Sản phẩm / Vật tư
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'RAW (NVL) | SEMI (BTP) | FINISHED (TP)',
  category_id VARCHAR(50),
  unit VARCHAR(50) NOT NULL,
  cost_price DECIMAL(15, 2) DEFAULT 0,
  sale_price DECIMAL(15, 2) DEFAULT 0,
  min_stock DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Bảng Đối tác (Khách hàng & Nhà cung cấp)
CREATE TABLE IF NOT EXISTS partners (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'CUSTOMER | SUPPLIER',
  phone VARCHAR(50),
  address VARCHAR(255),
  debt DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Bảng Quản trị Tồn kho theo Số Lô (Lot Number)
CREATE TABLE IF NOT EXISTS stock (
  id VARCHAR(50) PRIMARY KEY,
  warehouse_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  lot_number VARCHAR(100) NOT NULL,
  quantity DECIMAL(15, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wh_item_lot (warehouse_id, item_id, lot_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Bảng Định mức sản xuất (BOM Header)
CREATE TABLE IF NOT EXISTS boms (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_item_id VARCHAR(50) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  standard_qty DECIMAL(15, 2) DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6b. Bảng Chi tiết Vật tư trong BOM (BOM Items)
CREATE TABLE IF NOT EXISTS bom_items (
  id VARCHAR(50) PRIMARY KEY,
  bom_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  qty DECIMAL(15, 4) NOT NULL DEFAULT 1 COMMENT 'Định mức chuẩn cho 1 đơn vị SP',
  scrap_rate DECIMAL(8, 2) DEFAULT 0 COMMENT 'Tỷ lệ hao hụt %',
  note TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Bảng Lệnh sản xuất (Production Orders)
CREATE TABLE IF NOT EXISTS production_orders (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  target_item_id VARCHAR(50) NOT NULL,
  bom_id VARCHAR(50),
  planned_qty DECIMAL(15, 2) NOT NULL,
  actual_qty DECIMAL(15, 2) DEFAULT 0,
  defective_qty DECIMAL(15, 2) DEFAULT 0,
  lot_number VARCHAR(100),
  warehouse_id VARCHAR(50),
  status VARCHAR(30) DEFAULT 'DRAFT' COMMENT 'DRAFT | IN_PROGRESS | COMPLETED | CANCELLED',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7b. Bảng Công đoạn sản xuất (Production Stages)
CREATE TABLE IF NOT EXISTS production_stages (
  id VARCHAR(50) PRIMARY KEY,
  production_order_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  stage_order INT DEFAULT 1,
  status VARCHAR(30) DEFAULT 'PENDING' COMMENT 'PENDING | IN_PROGRESS | COMPLETED',
  completed_qty DECIMAL(15, 2) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7c. Bảng Phân bổ vật tư cho Lệnh sản xuất (Production Allocations)
CREATE TABLE IF NOT EXISTS production_allocations (
  id VARCHAR(50) PRIMARY KEY,
  production_order_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  planned_qty DECIMAL(15, 4) NOT NULL,
  allocated_qty DECIMAL(15, 4) DEFAULT 0,
  actual_used_qty DECIMAL(15, 4) DEFAULT 0,
  lot_number VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Bảng Chứng từ Kho (Stock Transactions Header)
CREATE TABLE IF NOT EXISTS stock_transactions (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(30) NOT NULL COMMENT 'IN_PURCHASE | IN_PRODUCTION | OUT_PRODUCTION | OUT_SALE | TRANSFER | ADJUST',
  status VARCHAR(20) DEFAULT 'DRAFT' COMMENT 'DRAFT | POSTED',
  source_warehouse_id VARCHAR(50),
  dest_warehouse_id VARCHAR(50),
  partner_id VARCHAR(50),
  ref_code VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8b. Bảng Chi tiết Chứng từ Kho (Stock Transaction Items)
CREATE TABLE IF NOT EXISTS stock_transaction_items (
  id VARCHAR(50) PRIMARY KEY,
  transaction_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  lot_number VARCHAR(100),
  qty DECIMAL(15, 2) NOT NULL,
  price DECIMAL(15, 2) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Bảng Đơn Mua Hàng (Purchase Orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  partner_id VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'DRAFT' COMMENT 'DRAFT | APPROVED | RECEIVED | CANCELLED',
  total_amount DECIMAL(15, 2) DEFAULT 0,
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  qty DECIMAL(15, 2) NOT NULL,
  received_qty DECIMAL(15, 2) DEFAULT 0,
  unit_price DECIMAL(15, 2) DEFAULT 0,
  amount DECIMAL(15, 2) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Bảng Đơn Bán Hàng (Sales Orders)
CREATE TABLE IF NOT EXISTS sales_orders (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  partner_id VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'DRAFT' COMMENT 'DRAFT | CONFIRMED | DELIVERED | CANCELLED',
  total_amount DECIMAL(15, 2) DEFAULT 0,
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales_order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  qty DECIMAL(15, 2) NOT NULL,
  delivered_qty DECIMAL(15, 2) DEFAULT 0,
  unit_price DECIMAL(15, 2) DEFAULT 0,
  amount DECIMAL(15, 2) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Bảng Phiếu Thu & Phiếu Chi
CREATE TABLE IF NOT EXISTS cash_receipts (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  partner_id VARCHAR(50),
  type VARCHAR(30) DEFAULT 'SALE',
  payment_method VARCHAR(20) DEFAULT 'BANK',
  amount DECIMAL(15, 2) NOT NULL,
  ref_code VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cash_payments (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  partner_id VARCHAR(50),
  type VARCHAR(30) DEFAULT 'PURCHASE',
  payment_method VARCHAR(20) DEFAULT 'BANK',
  amount DECIMAL(15, 2) NOT NULL,
  ref_code VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Bảng Tính Giá Thành Sản Xuất (Cost Calculations)
CREATE TABLE IF NOT EXISTS cost_calculations (
  id VARCHAR(50) PRIMARY KEY,
  production_order_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  target_item_code VARCHAR(50),
  target_item_name VARCHAR(255),
  completed_qty DECIMAL(15, 2) NOT NULL,
  material_cost DECIMAL(15, 2) DEFAULT 0 COMMENT 'Chi phí NVL trực tiếp (621)',
  labor_cost DECIMAL(15, 2) DEFAULT 0 COMMENT 'Chi phí Nhân công trực tiếp (622)',
  overhead_cost DECIMAL(15, 2) DEFAULT 0 COMMENT 'Chi phí Sản xuất chung (627)',
  total_cost DECIMAL(15, 2) DEFAULT 0 COMMENT 'Tổng giá thành (621+622+627)',
  unit_cost DECIMAL(15, 2) DEFAULT 0 COMMENT 'Giá thành đơn vị sản phẩm',
  standard_bom_cost DECIMAL(15, 2) DEFAULT 0 COMMENT 'Giá thành chuẩn theo định mức BOM',
  variance DECIMAL(15, 2) DEFAULT 0 COMMENT 'Chênh lệch chi phí (Actual - Standard)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"""

    sql_p = doc.add_paragraph()
    sql_p.paragraph_format.left_indent = Inches(0.1)
    sql_p.paragraph_format.space_after = Pt(12)
    r_sql = sql_p.add_run(sql_ddl)
    r_sql.font.name = "Consolas"
    r_sql.font.size = Pt(7.5)
    r_sql.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_page_break()

    # ==================== PHẦN 3: TỪ ĐIỂN DỮ LIỆU ====================
    h3 = doc.add_heading("PHẦN 3: TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATA DICTIONARY - 12 BẢNG CỐT LÕI)", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(8)

    p_dict = doc.add_paragraph(
        "Bảng tổng hợp chi tiết cấu trúc các trường thông tin trong cơ sở dữ liệu để BA nắm rõ logic nghiệp vụ, "
        "ràng buộc (constraints), kiểu dữ liệu và mối quan hệ giữa các bảng:"
    )
    p_dict.runs[0].font.size = Pt(10)

    tables_spec = [
        {
            "name": "1. items (Sản phẩm, Bán thành phẩm & Nguyên vật liệu)",
            "desc": "Lưu trữ toàn bộ danh mục hàng hóa của xưởng mộc.",
            "cols": [
                ("id", "VARCHAR(50)", "PK", "Mã định danh duy nhất (VD: ITM-01)"),
                ("code", "VARCHAR(50)", "UNIQUE", "Mã hàng hóa (VD: NVL-GO-01, TP-BAN-01)"),
                ("name", "VARCHAR(255)", "NOT NULL", "Tên sản phẩm/vật tư (VD: Gỗ Sồi Trắng Xẻ Sấy 4/4)"),
                ("type", "VARCHAR(20)", "NOT NULL", "Phân loại: RAW (Nguyên vật liệu) | SEMI (BTP) | FINISHED (Thành phẩm)"),
                ("category_id", "VARCHAR(50)", "FK", "Liên kết bảng categories.id"),
                ("unit", "VARCHAR(50)", "NOT NULL", "Đơn vị tính: m3, Tấm, Bộ, Cái, Thùng, Kg, Lít"),
                ("cost_price", "DECIMAL(15,2)", "DEFAULT 0", "Giá vốn / Giá mua dự tính (VNĐ)"),
                ("sale_price", "DECIMAL(15,2)", "DEFAULT 0", "Giá bán niêm yết (VNĐ)"),
                ("min_stock", "DECIMAL(15,2)", "DEFAULT 0", "Định mức tồn an toàn tối thiểu (dùng cảnh báo thiếu hàng)")
            ]
        },
        {
            "name": "2. stock (Tồn kho theo Kho & Số Lô - Lot Management)",
            "desc": "Quản lý số lượng hàng khả dụng trong kho chia nhỏ theo từng số lô.",
            "cols": [
                ("id", "VARCHAR(50)", "PK", "Mã định danh dòng tồn kho (VD: STK-01)"),
                ("warehouse_id", "VARCHAR(50)", "NOT NULL, FK", "Kho lưu trữ (liên kết warehouses.id)"),
                ("item_id", "VARCHAR(50)", "NOT NULL, FK", "Mặt hàng tồn (liên kết items.id)"),
                ("lot_number", "VARCHAR(100)", "NOT NULL", "Số lô nhập (VD: LOT-20261013-101, LOT-AUTO)"),
                ("quantity", "DECIMAL(15,2)", "NOT NULL", "Số lượng tồn kho thực tế"),
                ("updated_at", "TIMESTAMP", "ON UPDATE", "Thời gian cập nhật gần nhất")
            ]
        },
        {
            "name": "3. boms & bom_items (Định mức sản xuất - Bill of Materials)",
            "desc": "Khai báo công thức sản xuất cho 1 đơn vị Thành phẩm hoặc Bán thành phẩm.",
            "cols": [
                ("id", "VARCHAR(50)", "PK", "Mã định danh BOM (VD: BOM-01)"),
                ("code", "VARCHAR(50)", "UNIQUE", "Mã định mức (VD: BOM-BAN-GD01)"),
                ("target_item_id", "VARCHAR(50)", "NOT NULL, FK", "Thành phẩm sản xuất (items.id)"),
                ("standard_qty", "DECIMAL(15,2)", "DEFAULT 1", "Sản lượng chuẩn định mức áp dụng"),
                ("bom_items.qty", "DECIMAL(15,4)", "NOT NULL", "Số lượng vật tư tiêu hao cho standard_qty"),
                ("bom_items.scrap_rate", "DECIMAL(8,2)", "DEFAULT 0", "Tỷ lệ hao hụt % (mùn cưa, vát mép)")
            ]
        },
        {
            "name": "4. production_orders (Lệnh sản xuất & Tiến độ công đoạn)",
            "desc": "Chỉ thị điều hành sản xuất tại xưởng mộc.",
            "cols": [
                ("id", "VARCHAR(50)", "PK", "Mã định danh LSX (VD: PO-01)"),
                ("code", "VARCHAR(50)", "UNIQUE", "Số hiệu lệnh sản xuất (VD: LSX-202610-001)"),
                ("target_item_id", "VARCHAR(50)", "FK", "Mặt hàng cần sản xuất"),
                ("bom_id", "VARCHAR(50)", "FK", "BOM định mức áp dụng"),
                ("planned_qty", "DECIMAL(15,2)", "NOT NULL", "Số lượng kế hoạch cần hoàn thành"),
                ("actual_qty", "DECIMAL(15,2)", "DEFAULT 0", "Số lượng sản phẩm đạt tiêu chuẩn nghiệm thu"),
                ("defective_qty", "DECIMAL(15,2)", "DEFAULT 0", "Số lượng lỗi / phế phẩm phát sinh"),
                ("status", "VARCHAR(30)", "DEFAULT 'DRAFT'", "DRAFT (Mới lập) | IN_PROGRESS (Đang làm) | COMPLETED (Hoàn thành)")
            ]
        },
        {
            "name": "5. stock_transactions (Chứng từ xuất/nhập/điều chuyển kho)",
            "desc": "Nhật ký mọi biến động kho có kiểm soát ghi sổ (POSTED).",
            "cols": [
                ("id", "VARCHAR(50)", "PK", "Mã định danh chứng từ kho (VD: ST-01)"),
                ("code", "VARCHAR(50)", "UNIQUE", "Số phiếu (VD: PNK-10001, PXK-10002)"),
                ("type", "VARCHAR(30)", "NOT NULL", "IN_PURCHASE (Nhập mua) | OUT_PRODUCTION (Xuất SX) | IN_PRODUCTION (Nhập TP) | OUT_SALE (Xuất bán)"),
                ("status", "VARCHAR(20)", "DEFAULT 'DRAFT'", "DRAFT (Lưu tạm) | POSTED (Đã ghi sổ - trừ/cộng tồn kho)")
            ]
        },
        {
            "name": "6. cost_calculations (Tính giá thành sản phẩm)",
            "desc": "Bảng tổng hợp chi phí thực tế và so sánh chênh lệch với định mức.",
            "cols": [
                ("id", "VARCHAR(50)", "PK", "Mã tính giá thành"),
                ("production_order_id", "VARCHAR(50)", "FK", "Liên kết Lệnh sản xuất tương ứng"),
                ("material_cost", "DECIMAL(15,2)", "621", "Chi phí nguyên vật liệu thực tế xuất kho"),
                ("labor_cost", "DECIMAL(15,2)", "622", "Chi phí nhân công thợ mộc & thợ sơn"),
                ("overhead_cost", "DECIMAL(15,2)", "627", "Chi phí điện năng xưởng, khấu hao máy móc"),
                ("unit_cost", "DECIMAL(15,2)", "Cost/Unit", "Giá thành thực tế trên 1 đơn vị sản phẩm"),
                ("variance", "DECIMAL(15,2)", "Chênh lệch", "Chênh lệch giữa Giá thành thực tế và BOM chuẩn")
            ]
        }
    ]

    for t_info in tables_spec:
        h_t = doc.add_heading(t_info["name"], level=2)
        h_t.paragraph_format.space_before = Pt(8)
        h_t.paragraph_format.space_after = Pt(2)

        p_desc = doc.add_paragraph(t_info["desc"])
        p_desc.runs[0].font.size = Pt(9)
        p_desc.runs[0].font.italic = True
        p_desc.paragraph_format.space_after = Pt(4)

        tbl = doc.add_table(rows=len(t_info["cols"]) + 1, cols=4)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        headers = ["Tên Cột (Field)", "Kiểu Dữ Liệu", "Ràng Buộc", "Mô Tả & Ý Nghĩa Nghiệp Vụ"]
        col_widths = [Inches(1.8), Inches(1.3), Inches(1.1), Inches(2.6)]

        for c_idx, h_name in enumerate(headers):
            cell = tbl.rows[0].cells[c_idx]
            cell.width = col_widths[c_idx]
            cell.paragraphs[0].text = h_name
        style_table_header(tbl.rows[0], bg_color="1E293B")

        for r_idx, col_data in enumerate(t_info["cols"]):
            row = tbl.rows[r_idx + 1]
            for c_idx, val in enumerate(col_data):
                cell = row.cells[c_idx]
                cell.width = col_widths[c_idx]
                cell.paragraphs[0].text = val
        style_table_rows(tbl)

    doc.add_page_break()

    # ==================== PHẦN 4: MA TRẬN QUY TRÌNH NGHIỆP VỤ ====================
    h4 = doc.add_heading("PHẦN 4: MA TRẬN QUY TRÌNH NGHIỆP VỤ ĐẦU - CUỐI (END-TO-END WORKFLOWS)", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(8)

    p_wf = doc.add_paragraph(
        "Quy trình nghiệp vụ của xưởng gỗ được thiết kế khép kín từ khâu tiếp nhận đơn đặt hàng, "
        "bóc tách vật tư, mua hàng bổ sung, điều độ sản xuất qua 4 công đoạn, giao hàng cho khách đến quyết toán giá thành và công nợ:"
    )
    p_wf.runs[0].font.size = Pt(10)

    workflows = [
        ("4.1. Quy trình 1: Quản trị Danh mục & Quản lý Kho theo Số Lô (Lot Tracking)",
         "1. Thiết lập 3 kho chuẩn: Kho NVL (WH-NVL), Kho BTP Mộc thô (WH-BTP), Kho Thành phẩm hoàn thiện (WH-TP).\n"
         "2. Khai báo danh mục hàng hóa kèm đơn vị tính chuẩn (m3 cho gỗ tự nhiên, Tấm cho ván dán/MDF, Bộ cho phụ kiện).\n"
         "3. Mỗi lần nhập kho bắt buộc ghi nhận Số Lô (Lot Number). Khi xuất dùng hoặc kiểm kê, hệ thống quản lý chính xác từng lô hàng."),

        ("4.2. Quy trình 2: Lập Định mức BOM & Công cụ Tính toán Nhu cầu Vật tư Kế hoạch (MRP)",
         "1. Khai báo định mức cấu thành cho từng sản phẩm: Bao nhiêu m3 gỗ sồi, bao nhiêu tấm ván ép, bao nhiêu bộ ray bản lề, bao nhiêu kg sơn PU.\n"
         "2. Khai báo tỷ lệ hao hụt % (Scrap Rate) cho từng loại vật tư (VD: gỗ tự nhiên hao hụt 10%, sơn hao hụt 5%).\n"
         "3. Công cụ MRP Kế hoạch: Quản đốc xưởng nhập số lượng cần sản xuất -> Hệ thống tự động tính: Tổng nhu cầu = Định mức * (1 + % Hao hụt) * Số lượng SX.\n"
         "4. Hệ thống tự động đối chiếu tồn kho khả dụng hiện hữu và đưa ra cảnh báo 'Thiếu hàng' kèm số lượng còn thiếu chính xác."),

        ("4.3. Quy trình 3: Nhập mua Vật tư & Tính năng Nhập kho 1-Click từ Bảng MRP",
         "1. Khi bảng MRP phát hiện thiếu vật tư (ví dụ thiếu 2 Tấm ván MDF), hệ thống hiển thị nút 'Nhập kho' ngay tại dòng đó.\n"
         "2. Bấm nút 'Nhập kho': Hệ thống tự động điền sẵn tên vật tư, số lượng còn thiếu, tự chọn kho NVL và tự sinh mã lô mới.\n"
         "3. Bấm xác nhận: Hệ thống tạo phiếu nhập kho mua hàng (IN_PURCHASE) và ghi sổ (POSTED) tức thì.\n"
         "4. Tồn kho được cộng ngay lập tức, bảng MRP tự động tính lại và chuyển trạng thái từ 'Thiếu hàng' sang 'Đủ hàng' ngay trước mắt người dùng."),

        ("4.4. Quy trình 4: Đơn Hàng Bán (Sales Order) & Lập Kế hoạch Sản xuất",
         "1. Nhân viên kinh doanh lập Đơn hàng bán (Sales Order) cho khách hàng (ghi nhận ngày giao hẹn, đơn giá, số lượng).\n"
         "2. Trạng thái đơn hàng chuyển sang 'CONFIRMED' (Đã duyệt).\n"
         "3. Quản đốc chuyển thông tin sang bộ phận Kế hoạch để lập Lệnh sản xuất tương ứng."),

        ("4.5. Quy trình 5: Điều hành Lệnh Sản Xuất (LSX) qua 4 Công đoạn Xưởng Mộc",
         "Mỗi Lệnh sản xuất tự động sinh ra 4 công đoạn theo dõi tiến độ:\n"
         "   - Công đoạn 1: Cắt xẻ phôi gỗ thô (Xử lý cắt theo kích thước bản vẽ phôi).\n"
         "   - Công đoạn 2: Gia công định hình & Lắp ráp kết cấu thô (Tạo mộng, phay huỳnh, dán cạnh, ráp khung).\n"
         "   - Công đoạn 3: Xử lý bề mặt chà nhám & Phun sơn PU (Bả bột, lót 1, lót 2, sơn màu, bóng).\n"
         "   - Công đoạn 4: Lắp ráp phụ kiện & Đóng gói hoàn thiện (Bắt bản lề, tay nắm, bọc xốp màng PE).\n"
         "Quản đốc cập nhật sản lượng hoàn thành từng công đoạn. Khi công đoạn 4 hoàn thành, Lệnh sản xuất sẵn sàng nghiệm thu."),

        ("4.6. Quy trình 6: Xuất kho Vật tư Sản xuất & Nghiệm thu Nhập kho BTP/TP",
         "1. Xuất kho NVL phục vụ sản xuất: Tạo phiếu kho loại 'OUT_PRODUCTION', xuất theo định mức hoặc thực tế tiêu hao.\n"
         "2. Nghiệm thu sản phẩm hoàn thành: Tạo phiếu kho loại 'IN_PRODUCTION', nhập thành phẩm vào Kho TP (WH-TP) kèm Số Lô sản xuất mới sinh."),

        ("4.7. Quy trình 7: Giao hàng cho Khách & Trừ Kho Tự Động",
         "1. Vào Đơn hàng bán (Sales Order), bấm nút 'Giao hàng'.\n"
         "2. Hệ thống tự động kiểm tra tồn kho tại Kho Thành phẩm, tự động tìm kiếm các lô hàng có sẵn và trừ kho tương ứng.\n"
         "3. Tự động sinh phiếu xuất kho bán hàng (OUT_SALE) ở trạng thái POSTED.\n"
         "4. Đơn hàng cập nhật trạng thái 'DELIVERED' (Đã giao hàng)."),

        ("4.8. Quy trình 8: Tính Giá thành Sản xuất Thực tế (Costing) & Phân tích Chênh lệch",
         "1. Hệ thống tập hợp: Chi phí NVL (621) từ các phiếu xuất kho thực tế, Chi phí Nhân công (622), Chi phí SX chung (627).\n"
         "2. Tính giá thành thực tế: Giá thành đơn vị = Tổng chi phí / Số lượng thành phẩm hoàn thành.\n"
         "3. Đối chiếu với BOM chuẩn để tính Chênh lệch (Variance): Phát hiện kịp thời hao hụt vượt định mức hoặc chi phí đội giá."),

        ("4.9. Quy trình 9: Quản trị Tài chính & Thu Chi Công nợ",
         "1. Khi giao hàng bán, công nợ khách hàng tăng tương ứng giá trị đơn hàng.\n"
         "2. Khi khách thanh toán, kế toán lập Phiếu thu tiền (Cash Receipt) loại 'SALE' -> Công nợ khách hàng giảm tương ứng.\n"
         "3. Khi thanh toán tiền mua vật tư cho nhà cung cấp, lập Phiếu chi tiền (Cash Payment) loại 'PURCHASE' -> Giảm nợ phải trả NCC.")
    ]

    for title, desc in workflows:
        h_wf = doc.add_heading(title, level=2)
        h_wf.paragraph_format.space_before = Pt(10)
        h_wf.paragraph_format.space_after = Pt(4)
        p_d = doc.add_paragraph(desc)
        p_d.runs[0].font.size = Pt(9.5)
        p_d.paragraph_format.space_after = Pt(6)

    doc.add_page_break()

    # ==================== PHẦN 5: QUY TẮC NGHIỆP VỤ CHO BA ====================
    h5 = doc.add_heading("PHẦN 5: CÁC QUY TẮC NGHIỆP VỤ QUAN TRỌNG (BUSINESS RULES CHO BA)", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(8)

    rules = [
        ("Quy tắc 1: Không cho phép Xuất âm kho (Strict Negative Stock Prevention)",
         "Tại mọi thời điểm, khi thực hiện ghi sổ chứng từ xuất kho (POSTED), hệ thống bắt buộc kiểm tra số lượng tồn kho khả dụng theo từng Kho và từng Số Lô. Nếu Tồn kho < Số lượng yêu cầu xuất, hệ thống lập tức từ chối và báo lỗi rõ ràng."),
        
        ("Quy tắc 2: Tính bất biến của Chứng từ đã Ghi sổ (Immutable Posted Transactions)",
         "Chứng từ kho ở trạng thái DRAFT có thể chỉnh sửa và xóa. Tuy nhiên khi đã bấm Ghi sổ (POSTED), số lượng tồn kho đã bị điều chỉnh, chứng từ không được sửa trực tiếp mà phải lập chứng từ điều chỉnh (ADJUST) để bảo đảm tính toàn vẹn kiểm toán."),
        
        ("Quy tắc 3: Kiểm soát Xóa BOM đã phát sinh Lệnh Sản Xuất",
         "Hệ thống ngăn chặn việc xóa các định mức BOM nếu đã có ít nhất một Lệnh sản xuất (LSX) tham chiếu đến BOM đó, nhằm tránh mồ côi dữ liệu lịch sử giá thành."),

        ("Quy tắc 4: Tự động phân bổ Lô khi Giao hàng Bán",
         "Khi thực hiện Giao hàng từ Đơn bán (Sales Order Deliver), nếu người dùng không chọn số lô thủ công, hệ thống tự động quét các lô thành phẩm có sẵn trong kho theo cơ chế FIFO (nhập trước xuất trước) để cấn trừ số lượng.")
    ]

    for r_title, r_desc in rules:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.space_after = Pt(6)
        r_t = p_r.add_run(f"• {r_title}: ")
        r_t.font.bold = True
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = COLOR_PRIMARY
        r_d = p_r.add_run(r_desc)
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = COLOR_TEXT

    # ==================== PHẦN 6: KỊCH BẢN THỬ NGHIỆM END-TO-END ====================
    h6 = doc.add_heading("PHẦN 6: KỊCH BẢN THỬ NGHIỆM ĐẦU - CUỐI (TEST SCENARIO)", level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(8)

    p_sc = doc.add_paragraph(
        "BA có thể kiểm thử toàn bộ luồng nghiệp vụ trên hệ thống theo 6 bước tuần tự sau:"
    )
    p_sc.runs[0].font.size = Pt(10)

    sc_steps = [
        ("Bước 1: Kiểm tra Danh mục & Tồn kho ban đầu", "Vào 'Danh mục hàng hóa', kiểm tra mặt hàng [TP-BAN-01] Bàn Giám Đốc 1m8 và các NVL (Gỗ sồi, Ván MDF, Ray bản lề). Vào 'Quản lý kho' kiểm tra số lượng tồn ban đầu."),
        ("Bước 2: Kiểm tra Định mức BOM & Tính MRP", "Vào 'Định mức BOM', chọn BOM Bàn Giám Đốc 1m8. Đổi số lượng cần SX thành 20 bộ. Quan sát bảng MRP tính toán tổng nhu cầu và hiển thị cảnh báo 'Thiếu hàng' màu đỏ."),
        ("Bước 3: Thử nghiệm 1-Click Nhập kho nhanh", "Tại dòng vật tư bị thiếu, bấm nút 'Nhập kho'. Hộp thoại hiện ra với số lượng thiếu được điền sẵn. Bấm 'Nhập kho'. Hệ thống thông báo thành công và bảng MRP lập tức chuyển thành 'Đủ hàng'."),
        ("Bước 4: Tạo Đơn Bán Hàng & Giao Hàng", "Vào 'Đơn bán hàng', tạo đơn bán 5 Bàn Giám Đốc cho Khách hàng. Bấm Duyệt đơn -> Bấm Giao hàng. Hệ thống tự động trừ kho thành phẩm và chuyển trạng thái sang 'Đã giao hàng'."),
        ("Bước 5: Tạo Lệnh Sản Xuất & Điều phối Công đoạn", "Vào 'Lệnh sản xuất', tạo lệnh sản xuất 10 bàn. Cập nhật tiến độ lần lượt qua 4 công đoạn (Cắt xẻ -> Lắp ráp -> Sơn PU -> Đóng gói)."),
        ("Bước 6: Nghiệm thu & Tính Giá thành", "Nghiệm thu hoàn thành LSX. Vào 'Giá thành sản xuất', kiểm tra bảng tính chi phí tập hợp đủ 621, 622, 627 và hiển thị giá thành đơn vị kèm độ lệch so với BOM chuẩn.")
    ]

    for s_title, s_desc in sc_steps:
        p_s = doc.add_paragraph(style='List Bullet')
        p_s.paragraph_format.space_after = Pt(5)
        r_st = p_s.add_run(f"{s_title}: ")
        r_st.font.bold = True
        r_st.font.size = Pt(9.5)
        r_st.font.color.rgb = COLOR_SECONDARY
        r_sd = p_s.add_run(s_desc)
        r_sd.font.size = Pt(9.5)
        r_sd.font.color.rgb = COLOR_TEXT

    # Output file
    output_path = r"e:\MINI_MANUFACTURING_ERP\Tai_Lieu_Huong_Dan_Khoi_Tao_DB_Va_Nghiep_Vu_ERP_Xuong_Go.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()
