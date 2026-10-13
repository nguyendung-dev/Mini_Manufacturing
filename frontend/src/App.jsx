'use client';

import React, { useState, useEffect } from 'react';
import DashboardView from './views/DashboardView';
import CatalogView from './views/CatalogView';
import InventoryView from './views/InventoryView';
import BomView from './views/BomView';
import ProductionView from './views/ProductionView';
import OrdersView from './views/OrdersView';
import FinanceView from './views/FinanceView';
import CostingView from './views/CostingView';
import PermissionMatrixView from './views/PermissionMatrixView';
import LoginView from './views/LoginView';
import LotTraceModal from './components/LotTraceModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [tracingLot, setTracingLot] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Đọc phiên đăng nhập từ localStorage khi mở web
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('erp_user');
      const savedPerms = localStorage.getItem('erp_permissions');
      if (savedUser && savedPerms) {
        setCurrentUser(JSON.parse(savedUser));
        setPermissions(JSON.parse(savedPerms));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user, perms) => {
    setCurrentUser(user);
    setPermissions(perms);
    if (perms.dashboard) {
      setActiveModule('dashboard');
    } else if (perms.production_view) {
      setActiveModule('production');
    } else if (perms.inventory_view) {
      setActiveModule('inventory');
    } else if (perms.finance) {
      setActiveModule('finance');
    } else {
      setActiveModule('catalog');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_permissions');
    setCurrentUser(null);
    setPermissions(null);
  };

  // Cấu trúc phân hệ chuẩn ERP sản xuất theo đúng trình tự nghiệp vụ 1 -> 8
  const menuGroups = [
    {
      key: 'dieuhanh',
      title: 'TỔNG QUAN & HỆ THỐNG',
      items: [
        {
          id: 'dashboard',
          label: 'Bảng điều hành (Dashboard)',
          permKey: 'dashboard',
          breadcrumb: 'Tổng quan / Bảng điều hành sản xuất',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )
        },
        {
          id: 'matrix',
          label: 'Phân quyền người dùng (RBAC)',
          permKey: 'role_matrix',
          breadcrumb: 'Hệ thống / Ma trận phân quyền RBAC',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        }
      ]
    },
    {
      key: 'danhmuc',
      title: '1. DỮ LIỆU GỐC & KỸ THUẬT',
      items: [
        {
          id: 'catalog',
          label: 'Danh mục Vật tư, Kho & Đối tác',
          permKey: 'catalog',
          breadcrumb: 'Danh mục / Khai báo vật tư NVL, BTP, TP, Kho và Đối tác',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        },
        {
          id: 'boms',
          label: 'Định mức kỹ thuật (BOM)',
          permKey: 'boms',
          breadcrumb: 'Kỹ thuật / Định mức vật tư BOM & Tỷ lệ hao hụt',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        }
      ]
    },
    {
      key: 'kho_muahang',
      title: '2. MUA HÀNG & KHO VẬN',
      items: [
        {
          id: 'orders',
          label: 'Mua hàng (PO) & Bán hàng (SO)',
          permKey: 'orders',
          breadcrumb: 'Thương mại / Đơn mua hàng PO & Đơn bán hàng SO',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        },
        {
          id: 'inventory',
          label: 'Sổ kho & Tồn theo lô',
          permKey: 'inventory_view',
          breadcrumb: 'Kho vận / Quản lý xuất nhập tồn & Số lô vật tư',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )
        }
      ]
    },
    {
      key: 'sanxuat',
      title: '3. QUẢN LÝ SẢN XUẤT',
      items: [
        {
          id: 'production',
          label: 'Lệnh sản xuất (LSX)',
          permKey: 'production_view',
          breadcrumb: 'Sản xuất / Điều độ & Thực hiện lệnh sản xuất',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          )
        }
      ]
    },
    {
      key: 'taichinh',
      title: '4. TÀI CHÍNH & GIÁ THÀNH',
      items: [
        {
          id: 'finance',
          label: 'Thu chi & Sổ quỹ nội bộ',
          permKey: 'finance',
          breadcrumb: 'Tài chính / Phiếu thu, phiếu chi & Dòng tiền',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: 'costings',
          label: 'Giá thành thực tế & Quyết toán',
          permKey: 'costings',
          breadcrumb: 'Giá thành / Tập hợp chi phí thực tế & Chênh lệch BOM',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    }
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300 text-sm">
        Đang khởi động phần mềm HT softtech ERP...
      </div>
    );
  }

  // Nếu chưa đăng nhập: hiện trang Login chuẩn ERP
  if (!currentUser || !permissions) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Tìm breadcrumb hiện tại
  let currentBreadcrumb = 'Tổng quan / Bảng điều hành sản xuất';
  for (const g of menuGroups) {
    const found = g.items.find(i => i.id === activeModule);
    if (found) {
      currentBreadcrumb = found.breadcrumb;
      break;
    }
  }

  return (
    <div className="flex h-screen bg-zinc-50/60 font-sans antialiased text-zinc-950 overflow-hidden">
      {/* SIDEBAR BÊN TRÁI: Chuẩn shadcn/ui (Nền trắng, border-zinc-200, menu active zinc-900) */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-18 min-w-[72px] max-w-[72px]' : 'w-72 min-w-[280px] max-w-[280px]'
        } bg-white text-zinc-900 flex flex-col flex-shrink-0 transition-all duration-150 select-none border-r border-zinc-200`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
              HT
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight truncate flex-1">
                <div className="font-semibold text-sm text-zinc-950 tracking-tight truncate">
                  HT softtech ERP
                </div>
                <div className="text-[11px] text-zinc-500 font-normal truncate">
                  Quản Trị Xưởng Gỗ
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danh sách Menu Modules */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {menuGroups.map(group => {
            const allowedItems = group.items.filter(item => {
              const hasPerm = permissions[item.permKey];
              if (!hasPerm) return false;
              if (searchQuery) {
                return item.label.toLowerCase().includes(searchQuery.toLowerCase());
              }
              return true;
            });

            if (allowedItems.length === 0) return null;

            return (
              <div key={group.key} className="space-y-1">
                {/* Header Phân hệ */}
                {!sidebarCollapsed ? (
                  <div className="px-3 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    {group.title}
                  </div>
                ) : (
                  <div className="w-6 border-b border-zinc-200 mx-auto my-1.5" />
                )}

                {/* Danh sách mục */}
                <div className="space-y-0.5">
                  {allowedItems.map(item => {
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id)}
                        title={item.label}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-zinc-900 text-zinc-50 shadow-sm font-medium'
                            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                        } ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}`}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Chân Sidebar: Nút Thu Gọn Menu chuẩn shadcn/ui Ghost Button */}
        <div className="p-3 border-t border-zinc-200 bg-white">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full h-8 flex items-center justify-center gap-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors text-xs font-medium shadow-sm"
            title={sidebarCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!sidebarCollapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </aside>

      {/* KHU VỰC CHÍNH BÊN PHẢI */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER TRÊN CÙNG: Nền trắng tinh khiết, chuẩn shadcn/ui */}
        <header className="h-14 bg-white/95 backdrop-blur border-b border-zinc-200 flex items-center justify-between px-6 z-10 flex-shrink-0">
          {/* Breadcrumb vị trí hiện tại */}
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <span className="text-zinc-400 font-normal">Hệ thống /</span>
            <span className="text-zinc-900 font-semibold">{currentBreadcrumb}</span>
          </div>

          {/* Góc phải: Thông tin tài khoản */}
          <div className="flex items-center gap-3 text-xs">
            {/* Tài khoản Người dùng */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="h-8 px-2.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center gap-2 text-xs font-medium text-zinc-800 shadow-sm transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-[10px]">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left leading-tight hidden sm:block">
                  <span className="font-medium text-zinc-900 text-xs">{currentUser.full_name}</span>
                </div>
                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menu Đăng xuất */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-zinc-200 rounded-md shadow-md p-1 z-50">
                  <div className="px-3 py-2 border-b border-zinc-100 text-xs">
                    <div className="font-semibold text-zinc-900">{currentUser.full_name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">@{currentUser.username} ({currentUser.role})</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded flex items-center gap-2 font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* KHÔNG GIAN NỘI DUNG CHÍNH (NỀN SÁNG, DỄ ĐỌC SỐ LIỆU) */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-50/70">
          <div className="max-w-7xl mx-auto">
            {activeModule === 'dashboard' && <DashboardView onNavigate={(mod) => setActiveModule(mod)} />}
            {activeModule === 'catalog' && <CatalogView />}
            {activeModule === 'inventory' && <InventoryView onOpenTraceModal={(lot) => setTracingLot(lot)} />}
            {activeModule === 'boms' && <BomView />}
            {activeModule === 'production' && <ProductionView onOpenTraceModal={(lot) => setTracingLot(lot)} />}
            {activeModule === 'orders' && <OrdersView />}
            {activeModule === 'finance' && <FinanceView />}
            {activeModule === 'costings' && <CostingView />}
            {activeModule === 'matrix' && <PermissionMatrixView />}
          </div>
        </main>
      </div>

      {/* Modal Truy vết nguồn gốc số lô */}
      {tracingLot && (
        <LotTraceModal
          lotNumber={tracingLot}
          onClose={() => setTracingLot(null)}
        />
      )}
    </div>
  );
}
