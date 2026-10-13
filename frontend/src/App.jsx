'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from './api';
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
import UserProfileModal from './components/UserProfileModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [tracingLot, setTracingLot] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('profile');

  // Global Search states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Notification states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifContainerRef = useRef(null);

  // Target navigation states
  const [ordersTab, setOrdersTab] = useState('purchase');
  const [targetProductionId, setTargetProductionId] = useState(null);

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

  // Tải danh sách thông báo xưởng
  const loadNotifications = async () => {
    try {
      const data = await fetchApi('/reports/notifications');
      if (Array.isArray(data)) {
        setNotificationsList(data);
        setUnreadCount(data.length);
      }
    } catch (e) {
      console.error('Lỗi tải thông báo:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Phím tắt Ctrl+K để mở thanh tìm kiếm Menu & Phím Esc để đóng popups
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSidebarCollapsed(false);
        setTimeout(() => {
          const input = document.getElementById('sidebar-menu-search');
          if (input) input.focus();
        }, 50);
      }
      if (e.key === 'Escape') {
        setSearchDropdownOpen(false);
        setNotificationsOpen(false);
        setUserDropdownOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lắng nghe click bên ngoài để đóng dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search API query
  useEffect(() => {
    if (!globalSearchQuery || globalSearchQuery.trim().length === 0) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi(`/reports/global-search?q=${encodeURIComponent(globalSearchQuery.trim())}`);
        setSearchResults(Array.isArray(res) ? res : []);
        setSearchDropdownOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [globalSearchQuery]);

  // Điều hướng khi click vào kết quả tìm kiếm
  const handleSelectSearchResult = (item) => {
    setSearchDropdownOpen(false);
    setGlobalSearchQuery('');
    if (item.module === 'orders') {
      setOrdersTab(item.tab || 'purchase');
      setActiveModule('orders');
    } else if (item.module === 'production') {
      setTargetProductionId(item.targetId || item.code);
      setActiveModule('production');
    } else if (item.module === 'inventory') {
      if (item.lotNumber) {
        setTracingLot(item.lotNumber);
      } else {
        setActiveModule('inventory');
      }
    } else {
      setActiveModule(item.module);
    }
  };

  // Điều hướng khi click thông báo
  const handleSelectNotification = (notif) => {
    setNotificationsOpen(false);
    if (notif.module === 'orders') {
      setOrdersTab(notif.tab || 'purchase');
      setActiveModule('orders');
    } else if (notif.module === 'production') {
      if (notif.targetId) setTargetProductionId(notif.targetId);
      setActiveModule('production');
    } else if (notif.module === 'inventory') {
      setActiveModule('inventory');
    }
  };

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
          label: 'Bảng điều hành',
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
          label: 'Phân quyền (RBAC)',
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
      title: '1. KỸ THUẬT & DANH MỤC',
      items: [
        {
          id: 'catalog',
          label: 'Vật tư & Đối tác',
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
          label: 'Định mức BOM',
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
      title: '2. MUA HÀNG & KHO',
      items: [
        {
          id: 'orders',
          label: 'Mua & Bán hàng',
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
          label: 'Sổ kho & Số lô',
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
          label: 'Lệnh sản xuất',
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
          label: 'Thu chi & Sổ quỹ',
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
          label: 'Giá thành thực tế',
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
          sidebarCollapsed ? 'w-16 min-w-[64px] max-w-[64px]' : 'w-64 min-w-[245px] max-w-[245px]'
        } bg-white text-zinc-900 flex flex-col flex-shrink-0 transition-all duration-150 select-none border-r border-zinc-200`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-white">
              <img src="/logo.png" alt="HT softtech" className="w-8 h-8 object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight truncate flex-1">
                <div className="font-bold text-sm text-zinc-950 tracking-tight truncate">
                  HT softtech ERP
                </div>
                <div className="text-[11px] text-zinc-500 font-normal truncate">
                  Quản Trị Xưởng Gỗ
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thanh Tìm Kiếm Chức Năng Menu (Phím tắt Ctrl + K) */}
        {!sidebarCollapsed ? (
          <div className="px-3 pt-3 pb-1">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="sidebar-menu-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm chức năng..."
                className="w-full pl-9 pr-12 py-2 bg-zinc-100/90 hover:bg-zinc-100 focus:bg-white text-zinc-900 placeholder:text-zinc-400 text-xs rounded-lg border border-zinc-200 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all shadow-2xs"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-400 hover:text-zinc-600 p-0.5"
                    title="Xóa tìm kiếm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded shadow-2xs select-none">
                    Ctrl K
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-2 pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSidebarCollapsed(false);
                setTimeout(() => {
                  const input = document.getElementById('sidebar-menu-search');
                  if (input) input.focus();
                }, 50);
              }}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Tìm chức năng (Ctrl + K)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        )}

        {/* Danh sách Menu Modules với Cỡ Chữ Rõ Nét Hơn */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3.5">
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
                  <div className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
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
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13.5px] font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-zinc-900 text-zinc-50 shadow-sm font-semibold'
                            : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
                        } ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}`}
                      >
                        <span className="flex-shrink-0 [&>svg]:w-4.5 [&>svg]:h-4.5">{item.icon}</span>
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>



        {/* Chân Sidebar: Widget [ (A) admin ⌄ ]   [|] theo đúng thiết kế yêu cầu */}
        <div className="p-3 border-t border-zinc-200 bg-white">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              {/* Pill Dropdown Admin: Gọn theo chữ, nền trắng, viền tinh tế */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-full text-xs font-medium transition-all shadow-2xs group"
                  title="Thông tin tài khoản & hồ sơ"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {currentUser.username ? currentUser.username[0].toUpperCase() : 'A'}
                  </div>
                  <span className="text-xs font-semibold text-zinc-800">{currentUser.username || 'admin'}</span>
                  <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Popup Hồ sơ & Tài khoản đầy đủ */}
                {userDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* Header thông tin người dùng */}
                    <div className="px-3 py-2.5 border-b border-zinc-100 bg-zinc-50/70 rounded-lg mb-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {currentUser.username ? currentUser.username[0].toUpperCase() : 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-zinc-900 truncate">
                            {currentUser.full_name || 'Nguyễn Văn Quản Trị'}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono truncate">
                            @{currentUser.username || 'admin'} • {currentUser.role || 'ADMIN'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Phòng: Ban Điều Hành</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Online
                        </span>
                      </div>
                    </div>

                    {/* Danh sách mục thao tác hồ sơ */}
                    <div className="space-y-0.5 text-xs font-medium text-zinc-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileModal(true);
                          setProfileInitialTab('profile');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-100 rounded-md flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Hồ sơ tài khoản & Cá nhân</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileModal(true);
                          setProfileInitialTab('security');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-100 rounded-md flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Đổi mật khẩu bảo vệ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('matrix');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-100 rounded-md flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Phân quyền người dùng (RBAC)</span>
                      </button>
                    </div>

                    <div className="border-t border-zinc-100 my-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Đăng xuất hệ thống
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút Thu Gọn Menu [|] Chuẩn PanelLeft Icon */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md border border-zinc-200 transition-colors flex-shrink-0"
                title="Thu gọn thanh menu"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shadow-xs hover:bg-zinc-800"
                title={currentUser.username}
              >
                {currentUser.username ? currentUser.username[0].toUpperCase() : 'A'}
              </button>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-md border border-zinc-200 transition-colors"
                title="Mở rộng menu"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* KHU VỰC CHÍNH BÊN PHẢI */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER TRÊN CÙNG: Nền trắng tinh khiết, chuẩn shadcn/ui */}
        <header className="h-14 bg-white/95 backdrop-blur border-b border-zinc-200 flex items-center justify-between px-6 z-10 flex-shrink-0 gap-4">
          {/* Vị trí breadcrumb bên trái */}
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 flex-shrink-0">
            <span className="text-zinc-400 font-normal">Hệ thống /</span>
            <span className="text-zinc-900 font-semibold">{currentBreadcrumb}</span>
          </div>

          {/* KHU VỰC BÊN PHẢI: THANH TÌM KIẾM MÃ SÍT CẠNH NÚT THÔNG BÁO */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Thanh Tìm Kiếm Mã Toàn Hệ Thống (Không phím tắt) */}
            <div className="relative w-64 sm:w-80" ref={searchContainerRef}>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="global-header-search"
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setSearchDropdownOpen(true); }}
                  placeholder="Tìm nhanh mã (PO, SO, LSX, BOM, Lô, Vật tư)..."
                  className="w-full pl-9 pr-8 py-1.5 bg-zinc-100/90 hover:bg-zinc-100 focus:bg-white text-zinc-900 placeholder:text-zinc-400 text-xs rounded-lg border border-zinc-200 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all shadow-2xs"
                />
                {globalSearchQuery && (
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                    <button
                      type="button"
                      onClick={() => { setGlobalSearchQuery(''); setSearchDropdownOpen(false); }}
                      className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded"
                      title="Xóa tìm kiếm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown Kết Quả Tìm Kiếm Theo Mã */}
              {searchDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-white border border-zinc-200 rounded-xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto animate-in fade-in duration-100">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      Đang tìm kiếm mã liên quan...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Kết quả tìm kiếm ({searchResults.length})
                      </div>
                      {searchResults.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSearchResult(item)}
                          className="w-full text-left p-2 rounded-lg hover:bg-zinc-100 flex items-start justify-between gap-3 transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                              <span className="font-bold text-xs text-zinc-900 group-hover:text-blue-600 font-mono">
                                {item.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1 group-hover:text-zinc-800 flex-shrink-0 pt-0.5 font-medium">
                            <span>Xem</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      Không tìm thấy chứng từ hoặc mã nào khớp với "{globalSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nút Chuông Thông Báo */}
            <div className="relative" ref={notifContainerRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition-colors border border-zinc-200"
                title="Trung tâm thông báo & Cảnh báo xưởng"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Popover Danh sách thông báo */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-zinc-200 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900">Thông báo & Cảnh báo</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                        {unreadCount} mới
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setUnreadCount(0)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-800 transition-colors font-medium"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 text-xs">
                    {notificationsList.length > 0 ? (
                      notificationsList.map((notif) => (
                        <button
                          key={notif.id}
                          type="button"
                          onClick={() => handleSelectNotification(notif)}
                          className="w-full text-left p-3 hover:bg-zinc-50 transition-colors flex items-start gap-2.5 group"
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            notif.level === 'warning' ? 'bg-amber-500 ring-2 ring-amber-100' : 'bg-blue-500 ring-2 ring-blue-100'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-zinc-900 group-hover:text-blue-600 flex items-center justify-between">
                              <span className="truncate">{notif.title}</span>
                              <span className="text-[10px] text-zinc-400 font-normal flex-shrink-0">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-zinc-500">
                        Hiện không có cảnh báo nào cần xử lý.
                      </div>
                    )}
                  </div>
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
            {activeModule === 'production' && (
              <ProductionView
                onOpenTraceModal={(lot) => setTracingLot(lot)}
                targetOrderId={targetProductionId}
              />
            )}
            {activeModule === 'orders' && <OrdersView initialTab={ordersTab} />}
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

      {/* Modal Thông tin Tài khoản & Hồ sơ cá nhân */}
      {showProfileModal && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('erp_user', JSON.stringify(updated));
          }}
        />
      )}
    </div>
  );
}

