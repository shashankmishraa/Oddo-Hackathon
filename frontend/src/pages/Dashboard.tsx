import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Bus,
  Users,
  Compass,
  CheckCircle,
  Clock,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['dashboard_summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
        <ShieldAlert size={18} className="shrink-0" />
        <p className="font-medium">Failed to retrieve dashboard statistics</p>
      </div>
    );
  }

  const kpis = report?.kpis || {
    activeVehicles: 0,
    availableVehicles: 0,
    vehiclesInShop: 0,
    driversOnDuty: 0,
    fleetUtilization: 0,
    activeTrips: 0,
    pendingTrips: 0
  };

  const dists = report?.distributions || {
    vehicles: { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 }
  };

  const charts = report?.charts || {
    monthlyFuel: Array(12).fill(0),
    monthlyExpenses: Array(12).fill(0)
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((m, idx) => ({
    name: m,
    'Fuel Cost': charts.monthlyFuel[idx] || 0,
    'Expenses': charts.monthlyExpenses[idx] || 0
  }));

  const vehicleDistData = [
    { name: 'Available', value: dists.vehicles.AVAILABLE || 0, color: '#10b981' },
    { name: 'On Trip', value: dists.vehicles.ON_TRIP || 0, color: '#3b82f6' },
    { name: 'In Shop', value: dists.vehicles.IN_SHOP || 0, color: '#f59e0b' },
    { name: 'Retired', value: dists.vehicles.RETIRED || 0, color: '#64748b' }
  ].filter((item) => item.value > 0);

  const cardData = [
    { label: 'Active Vehicles', value: kpis.activeVehicles, sub: 'Fleet operating size', icon: Bus, color: 'text-blue-600 bg-blue-50' },
    { label: 'Available Vehicles', value: kpis.availableVehicles, sub: 'Ready for dispatches', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Vehicles In Shop', value: kpis.vehiclesInShop, sub: 'Repair operations open', icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Fleet Utilization', value: `${kpis.fleetUtilization}%`, sub: 'Current active trips', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Drivers On Duty', value: kpis.driversOnDuty, sub: 'Available + On-Trip', icon: Users, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Active Trips', value: kpis.activeTrips, sub: 'Vehicles currently en-route', icon: Compass, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Dispatches', value: kpis.pendingTrips, sub: 'Draft transit plans', icon: Clock, color: 'text-violet-600 bg-violet-50' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Operations Dashboard</h1>
        <p className="text-slate-500 mt-1 font-medium">Real-time indicators and fleet diagnostic indexes</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center space-x-5 shadow-sm">
              <div className={`p-4 rounded-2xl ${card.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{card.value}</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{card.label}</p>
                <p className="text-xs text-slate-400 mt-1 font-semibold">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cost Analytics Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Yearly Cost Analytics (₹)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Fuel Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distributions Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-6">Fleet Distributions</h2>
            <div className="h-64 flex items-center justify-center relative">
              {vehicleDistData.length === 0 ? (
                <p className="text-slate-500 text-xs">No assets registered</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {vehicleDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-900">{kpis.activeVehicles}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Active</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {vehicleDistData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-650">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="text-slate-900 font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
