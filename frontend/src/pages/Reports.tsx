import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FileDown, FileBarChart, Compass, Gauge, DollarSign, BarChart3, ShieldAlert } from 'lucide-react';

interface ReportItem {
  vehicleId: string;
  registrationNumber: string;
  make: string;
  model: string;
  odometer: number;
  totalLiters: number;
  totalFuelCost: number;
  fuelEfficiency: number; // Km/L
  tripCount: number;
  totalMaintenanceCost: number;
  totalExpenses: number;
  totalOperationalCost: number;
  totalCargoDelivered: number;
  roi: number; // Cargo / Cost
}

export const Reports: React.FC = () => {
  // Queries
  const { data: reportDataResponse, isLoading, error } = useQuery({
    queryKey: ['fleet_reports'],
    queryFn: async () => {
      const res = await api.get('/reports/summary');
      return res.data.data as ReportItem[];
    }
  });

  const reportData = reportDataResponse || [];

  const handleExportCSV = () => {
    const headers = [
      'Vehicle ID',
      'Registration Number',
      'Make',
      'Model',
      'Current Mileage (Km)',
      'Total Fuel (Liters)',
      'Total Fuel Cost ($)',
      'Fuel Efficiency (Km/L)',
      'Total Trips Completed',
      'Total Maintenance Cost ($)',
      'Total Expenses ($)',
      'Total Operational Cost ($)',
      'Total Cargo Units Delivered',
      'ROI Ratio (Cargo/Cost)'
    ];

    const rows = reportData.map((i) => [
      i.vehicleId,
      `"${i.registrationNumber}"`,
      `"${i.make}"`,
      `"${i.model}"`,
      i.odometer,
      i.totalLiters,
      i.totalFuelCost,
      i.fuelEfficiency.toFixed(2),
      i.tripCount,
      i.totalMaintenanceCost,
      i.totalExpenses,
      i.totalOperationalCost,
      i.totalCargoDelivered,
      i.roi.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transitops_fleet_operational_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMileage = reportData.reduce((sum, i) => sum + i.odometer, 0);
  const totalOpsCost = reportData.reduce((sum, i) => sum + i.totalOperationalCost, 0);
  const totalDispatches = reportData.reduce((sum, i) => sum + i.tripCount, 0);
  const averageROI = reportData.length > 0
    ? reportData.reduce((sum, i) => sum + i.roi, 0) / reportData.length
    : 0;

  if (error) {
    return (
      <div className="flex items-center space-x-2.5 rounded-xl border border-rose-250 bg-rose-50 p-4 text-sm text-rose-600">
        <ShieldAlert size={18} className="shrink-0" />
        <p className="font-medium">Failed to retrieve operational reports statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Diagnostic Reports</h1>
          <p className="text-slate-505 mt-1 font-medium">Aggregated operational metrics, ROI diagnostics, and spreadsheet downloads</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={isLoading || reportData.length === 0}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10 transition-all font-semibold text-sm self-start sm:self-auto disabled:opacity-50"
        >
          <FileDown size={16} />
          <span>Export Excel/CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center space-x-4 shadow-sm">
          <div className="p-3.5 rounded-2xl text-blue-600 bg-blue-50">
            <Gauge size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average Mileage</p>
            <p className="text-xl font-extrabold text-slate-950 mt-0.5">
              {isLoading ? '...' : (totalMileage / (reportData.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 1 })} Km
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center space-x-4 shadow-sm">
          <div className="p-3.5 rounded-2xl text-amber-600 bg-amber-50">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Operations Cost</p>
            <p className="text-xl font-extrabold text-slate-950 mt-0.5">
              {isLoading ? '...' : `$${totalOpsCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center space-x-4 shadow-sm">
          <div className="p-3.5 rounded-2xl text-violet-600 bg-violet-50">
            <Compass size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Fleet Dispatches</p>
            <p className="text-xl font-extrabold text-slate-950 mt-0.5">
              {isLoading ? '...' : totalDispatches} Completed
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center space-x-4 shadow-sm">
          <div className="p-3.5 rounded-2xl text-emerald-600 bg-emerald-50">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average ROI Ratio</p>
            <p className="text-xl font-extrabold text-slate-950 mt-0.5">
              {isLoading ? '...' : averageROI.toFixed(2)} Cargo/$
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Vehicle Assets</th>
                  <th className="px-6 py-4">Odometer</th>
                  <th className="px-6 py-4">Fuel Efficiency</th>
                  <th className="px-6 py-4">Trips Count</th>
                  <th className="px-6 py-4">Repair Cost</th>
                  <th className="px-6 py-4">Ledger Expenses</th>
                  <th className="px-6 py-4 text-emerald-600 font-bold">Operational Cost</th>
                  <th className="px-6 py-4 text-violet-600 font-bold">ROI Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-650">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No active reports available.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row) => (
                    <tr key={row.vehicleId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono font-bold text-slate-800">{row.registrationNumber}</p>
                        <p className="text-xs text-slate-450">{row.make} {row.model.split(' (')[0]}</p>
                      </td>
                      <td className="px-6 py-4 font-mono">{row.odometer.toLocaleString()} Km</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {row.fuelEfficiency > 0 ? `${row.fuelEfficiency.toFixed(2)} Km/L` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-mono">{row.tripCount} dispatches</td>
                      <td className="px-6 py-4 font-mono">${row.totalMaintenanceCost.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono">${row.totalExpenses.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                        ${row.totalOperationalCost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5 text-violet-600 font-bold font-mono">
                          <FileBarChart size={14} />
                          <span>{row.roi.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default Reports;
