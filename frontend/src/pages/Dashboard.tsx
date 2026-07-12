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
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Bus,
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
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2.5 rounded-xl border border-rose-250 bg-rose-50/20 p-4 text-sm text-rose-600">
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
    vehicles: { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 },
    drivers: { AVAILABLE: 0, ON_TRIP: 0, OFF_DUTY: 0, SUSPENDED: 0 },
    trips: { DRAFT: 0, DISPATCHED: 0, COMPLETED: 0, CANCELLED: 0 }
  };

  const charts = report?.charts || {
    monthlyFuel: Array(12).fill(0),
    monthlyExpenses: Array(12).fill(0),
    monthlyRevenue: Array(12).fill(0),
    monthlyFuelLiters: Array(12).fill(0),
    monthlyMaintenance: Array(12).fill(0),
    monthlyFleetUtilization: Array(12).fill(0),
    topVehiclesByDistance: []
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Chart datasets mapping
  const monthlyFinanceData = months.map((m, idx) => ({
    name: m,
    'Revenue': charts.monthlyRevenue[idx] || 0,
    'Expenses': charts.monthlyExpenses[idx] || 0
  }));

  const fleetUtilizationTrend = months.map((m, idx) => ({
    name: m,
    'Utilization %': charts.monthlyFleetUtilization[idx] || 0
  }));

  const fuelConsumptionData = months.map((m, idx) => ({
    name: m,
    'Fuel Liters': charts.monthlyFuelLiters[idx] || 0
  }));

  const maintenanceCostData = months.map((m, idx) => ({
    name: m,
    'Cost (₹)': charts.monthlyMaintenance[idx] || 0
  }));

  // Distributions Pie mapping
  const vehicleDistData = [
    { name: 'Available', value: dists.vehicles.AVAILABLE || 0, color: '#10b981' },
    { name: 'On Trip', value: dists.vehicles.ON_TRIP || 0, color: '#3b82f6' },
    { name: 'In Shop', value: dists.vehicles.IN_SHOP || 0, color: '#f59e0b' },
    { name: 'Retired', value: dists.vehicles.RETIRED || 0, color: '#64748b' }
  ].filter((item) => item.value > 0);

  const tripDistData = [
    { name: 'Scheduled', value: dists.trips.DRAFT || 0, color: '#f59e0b' },
    { name: 'En Route', value: dists.trips.DISPATCHED || 0, color: '#3b82f6' },
    { name: 'Completed', value: dists.trips.COMPLETED || 0, color: '#10b981' },
    { name: 'Cancelled', value: dists.trips.CANCELLED || 0, color: '#ef4444' }
  ].filter((item) => item.value > 0);

  const cardData = [
    { label: 'Active Vehicles', value: kpis.activeVehicles, sub: 'Fleet operating size', icon: Bus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' },
    { label: 'Available Vehicles', value: kpis.availableVehicles, sub: 'Ready for dispatches', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' },
    { label: 'Vehicles In Shop', value: kpis.vehiclesInShop, sub: 'Repair operations open', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30' },
    { label: 'Fleet Utilization', value: `${kpis.fleetUtilization}%`, sub: 'Current active trips', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Operations Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time indicators and fleet diagnostic indexes</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-5 shadow-sm">
              <div className={`p-4 rounded-2xl ${card.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{card.value}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-350 mt-0.5">{card.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Revenue vs Expenses (Bar Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Revenue vs Expenses</h2>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">INR (₹)</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  formatter={(value: any) => [formatCurrency(value), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar name="Revenue" dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Total Expenses" dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Distributions Pie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Vehicle Status Distribution</h2>
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
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {vehicleDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis.activeVehicles}</span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Active Assets</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {vehicleDistData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-650 dark:text-slate-350 p-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Fleet Utilization & Trip Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fleet Utilization trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Monthly Fleet Utilization Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fleetUtilizationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="Utilization %" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUtil)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trip Distribution Pie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Trip Distribution Status</h2>
            <div className="h-64 flex items-center justify-center relative">
              {tripDistData.length === 0 ? (
                <p className="text-slate-500 text-xs">No dispatches scheduled</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tripDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tripDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {tripDistData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Total Trips</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {tripDistData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-650 dark:text-slate-350 p-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Fuel logs liters, Maintenance costs, Top vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fuel Consumption Trend (Liters) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Fuel Consumption Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelConsumptionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val} L`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }} />
                <Line type="monotone" name="Liters Spent" dataKey="Fuel Liters" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Cost Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Maintenance Cost Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceCostData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(value: any) => [formatCurrency(value), '']}
                />
                <Bar name="Service Cost" dataKey="Cost (₹)" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vehicles by Distance (Horizontal Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Vehicles by Distance</h2>
          <div className="h-64">
            {charts.topVehiclesByDistance.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-450 text-xs">No active asset data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={charts.topVehiclesByDistance}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val/1000}k`} />
                  <YAxis dataKey="registrationNumber" type="category" stroke="#64748b" fontSize={10} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(value: any) => [`${value.toLocaleString()} Km`, 'Distance']}
                  />
                  <Bar dataKey="distance" fill="#818cf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
