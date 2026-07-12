import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  FileBarChart
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Vehicles', path: '/fleet', icon: Bus },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Trips', path: '/trips', icon: Calendar },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Fuel Logs', path: '/fuel', icon: Fuel },
    { name: 'Expenses', path: '/expenses', icon: DollarSign },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'DISPATCHER': return 'bg-violet-50 text-violet-600 border border-violet-100';
      case 'DRIVER': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-slate-800 bg-[#090d1f] transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
            <span className="p-2 rounded-lg bg-blue-600 text-white">
              <Truck size={20} />
            </span>
            <span>Transit<span className="text-blue-500">Ops</span></span>
          </Link>
          <button className="text-slate-400 hover:text-white md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info Block */}
        <div className="p-4 border-t border-slate-800 bg-[#070a1a]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold">
              {user?.firstName?.[0] || <User size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <div className="flex items-center mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full space-x-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-rose-900/30 text-rose-400 hover:bg-rose-500/10 transition-colors duration-200 font-medium text-sm"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-slate-200 bg-white shadow-sm">
          <button
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-medium">Ops Terminal</p>
              <p className="text-xs text-emerald-600 flex items-center space-x-1 justify-end font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block mr-1"></span>
                System Live
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic page contents nested inside */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
