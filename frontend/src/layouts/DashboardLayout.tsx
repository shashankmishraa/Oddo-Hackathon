import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessPage, getRoleLabel } from '../utils/rbac';
import {
  LayoutDashboard,
  Bus,
  Users,
  Calendar,
  LogOut,
  Menu,
  X,
  Truck,
  User,
  Wrench,
  Fuel,
  DollarSign,
  FileBarChart,
  ShieldCheck,
} from 'lucide-react';

// All possible nav items — filtered per role via RBAC
const ALL_MENU_ITEMS = [
  { name: 'Dashboard',    path: '/',            icon: LayoutDashboard, page: 'dashboard'   },
  { name: 'Vehicles',     path: '/fleet',       icon: Bus,             page: 'fleet'       },
  { name: 'Drivers',      path: '/drivers',     icon: Users,           page: 'drivers'     },
  { name: 'Trips',        path: '/trips',       icon: Calendar,        page: 'trips'       },
  { name: 'Maintenance',  path: '/maintenance', icon: Wrench,          page: 'maintenance' },
  { name: 'Fuel Logs',    path: '/fuel',        icon: Fuel,            page: 'fuel'        },
  { name: 'Expenses',     path: '/expenses',    icon: DollarSign,      page: 'expenses'    },
  { name: 'Reports',      path: '/reports',     icon: FileBarChart,    page: 'reports'     },
];

const ROLE_BADGE: Record<string, string> = {
  ADMIN:             'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  DISPATCHER:        'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  SAFETY_OFFICER:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  FINANCIAL_ANALYST: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  DRIVER:            'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = (user as any)?.role as string | undefined;

  // Filter nav items to only what this role may access
  const menuItems = ALL_MENU_ITEMS.filter((item) => canAccessPage(role, item.page));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If user tries to access a page outside their allowed pages, redirect to dashboard
  const currentPage = ALL_MENU_ITEMS.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );
  if (currentPage && !canAccessPage(role, currentPage.page)) {
    return <Navigate to="/" replace />;
  }

  const badgeClass = ROLE_BADGE[role || ''] || ROLE_BADGE.DRIVER;

  return (
    <div className="flex h-screen bg-[#070913] text-slate-100 overflow-hidden">

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64
        border-r border-slate-800 bg-[#090d1f]
        transition-transform duration-300
        md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
            <span className="p-2 rounded-lg bg-blue-600 text-white">
              <Truck size={20} />
            </span>
            <span>Transit<span className="text-blue-400">Ops</span></span>
          </Link>
          <button
            className="text-slate-400 hover:text-white md:hidden transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon
                  size={18}
                  className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-500'}`}
                />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Role Badge + User Info + Logout */}
        <div className="p-4 border-t border-slate-800 bg-[#070a1a]">
          {/* Role indicator */}
          <div className="flex items-center space-x-2 mb-3 px-1">
            <ShieldCheck size={13} className="text-slate-500 shrink-0" />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>
              {getRoleLabel(role)}
            </span>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm shrink-0">
              {user?.firstName?.[0] || <User size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full space-x-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-rose-900/40 text-rose-400 hover:bg-rose-500/10 transition-colors duration-200 font-medium text-sm"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-[#0c0f24]/80 backdrop-blur-xl z-30">
          <button
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 font-medium">Ops Terminal</p>
              <p className="text-xs text-emerald-500 flex items-center space-x-1 justify-end font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block mr-1"></span>
                System Live
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#070913] print:bg-white">
          <div className="p-6 md:p-8 max-w-7xl mx-auto print:p-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
