import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Check, ShieldAlert, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { TableFilters } from '../components/TableFilters';
import { canCreate, canDelete } from '../utils/rbac';

const SORT_OPTIONS = [
  { value: 'date', label: 'Refuel Date' },
  { value: 'liters', label: 'Fuel Quantity (Liters)' },
  { value: 'cost', label: 'Fuel Cost' },
];

export const Fuel: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [liters, setLiters] = useState(50);
  const [cost, setCost] = useState(75);
  const [odo, setOdo] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, vehicleFilter, driverFilter, dateStart, dateEnd, sortBy, sortOrder]);

  // Queries
  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['fuel', searchTerm, vehicleFilter, driverFilter, dateStart, dateEnd, sortBy, sortOrder, page],
    queryFn: async () => {
      const res = await api.get('/fuel', {
        params: {
          search: searchTerm || undefined,
          vehicleId: vehicleFilter !== 'ALL' ? vehicleFilter : undefined,
          driverId: driverFilter !== 'ALL' ? driverFilter : undefined,
          dateStart: dateStart || undefined,
          dateEnd: dateEnd || undefined,
          sortBy,
          sortOrder,
          page,
          limit: 8,
        },
      });
      return res.data.data;
    },
  });

  const { data: vehiclesResponse } = useQuery({
    queryKey: ['vehicles_list'],
    queryFn: async () => {
      const res = await api.get('/vehicles', { params: { limit: 100 } });
      return res.data.data?.data || [];
    },
  });

  const { data: driversResponse } = useQuery({
    queryKey: ['drivers_list'],
    queryFn: async () => {
      const res = await api.get('/drivers', { params: { limit: 100 } });
      return res.data.data?.data || [];
    },
  });

  const logs = logsResponse?.data || [];
  const totalPages = logsResponse?.totalPages || 1;
  const vehicles = vehiclesResponse || [];
  const rawDrivers = driversResponse || [];

  const drivers = rawDrivers.map((d: any) => ({
    id: d.id,
    name: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Unknown Operator',
  }));

  // Auto-fill odometer when vehicle changes in add log form
  useEffect(() => {
    if (vehicleId) {
      const selected = vehicles.find((v: any) => v.id === vehicleId);
      if (selected) {
        setOdo(selected.odometer);
      }
    }
  }, [vehicleId, vehicles]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/fuel', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Fuel receipt logged successfully.');
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(null);
        setVehicleId('');
        setDriverId('');
        setLiters(50);
        setCost(75);
        setOdo(0);
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to record fuel log');
      setTimeout(() => setError(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/fuel/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete fuel log');
    },
  });

  const handleRecordFuel = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehicleId || !driverId || liters <= 0 || cost <= 0 || odo <= 0) {
      setError('Please fill in all mandatory fields with valid values');
      return;
    }

    const selectedVehicle = vehicles.find((v: any) => v.id === vehicleId);
    if (!selectedVehicle) return;

    if (odo < selectedVehicle.odometer) {
      setError(`Odometer reading cannot be less than vehicle's current mileage (${selectedVehicle.odometer} Km)`);
      return;
    }

    createMutation.mutate({
      vehicleId,
      driverId,
      liters,
      cost,
      odometerReading: odo,
      date: new Date(date).toISOString(),
    });
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm('Delete this fuel log entry permanently?')) {
      deleteMutation.mutate(id);
    }
  };

  const role = (user as any)?.role as string | undefined;
  const canAddFuel = canCreate(role, 'fuel');
  const canDeleteFuel = canDelete(role, 'fuel');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Fuel Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Record fuel purchases, track quantities, and evaluate mileage averages</p>
        </div>
        {canAddFuel && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Record Refuel</span>
          </button>
        )}
      </div>

      {/* Reusable Filters */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search fuel log plates or driver name..."
        extraDropdowns={[
          {
            value: vehicleFilter,
            onChange: setVehicleFilter,
            options: vehicles.map((v: any) => ({ value: v.id, label: v.registrationNumber })),
            placeholder: 'All Vehicles',
          },
          {
            value: driverFilter,
            onChange: setDriverFilter,
            options: drivers.map((d: any) => ({ value: d.id, label: d.name })),
            placeholder: 'All Drivers',
          },
        ]}
        dateStart={dateStart}
        onDateStartChange={setDateStart}
        dateEnd={dateEnd}
        onDateEndChange={setDateEnd}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOptions={SORT_OPTIONS}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onReset={() => {
          setSearchTerm('');
          setVehicleFilter('ALL');
          setDriverFilter('ALL');
          setDateStart('');
          setDateEnd('');
          setSortBy('date');
          setSortOrder('desc');
          setPage(1);
        }}
        onExportPDF={() => window.print()}
      />

      {/* Fuel logs table list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm print:border-none print:shadow-none">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4">Refueled Vehicle</th>
                  <th className="px-6 py-4">Purchased Quantity</th>
                  <th className="px-6 py-4">Refuel Cost</th>
                  <th className="px-6 py-4">Odometer (Km)</th>
                  <th className="px-6 py-4">Driver Name</th>
                  <th className="px-6 py-4">Log Date</th>
                  <th className="px-6 py-4 text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-650 dark:text-slate-350">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No fuel log records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((l: any) => {
                    const veh = vehicles.find((v: any) => v.id === l.vehicleId);
                    const drv = drivers.find((d: any) => d.id === l.driverId);

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{veh?.make} {veh?.model.split(' (')[0]}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{veh?.registrationNumber}</p>
                        </td>
                        <td className="px-6 py-4 font-mono">{l.liters} Liters</td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(l.cost)}</td>
                        <td className="px-6 py-4 font-mono">{l.odometerReading.toLocaleString()} Km</td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{drv?.name || 'Unknown Operator'}</td>
                        <td className="px-6 py-4 font-mono">{new Date(l.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center print:hidden">
                          {canDeleteFuel && (
                            <button
                              onClick={() => handleDeleteLog(l.id)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Delete log"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Record Refuel */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Fuel Entry</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-850">✕</button>
            </div>

            {error && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/10 p-3 text-xs text-rose-600 dark:text-rose-455">
                <ShieldAlert size={16} />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/10 p-3 text-xs text-emerald-600 dark:text-emerald-455">
                <Check size={16} />
                <p className="font-semibold">{success}</p>
              </div>
            )}

            <form onSubmit={handleRecordFuel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Fleet Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                >
                  <option value="">-- Choose active asset --</option>
                  {vehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model.split(' (')[0]} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Operator Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                >
                  <option value="">-- Choose active driver --</option>
                  {drivers.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Quantity (Liters)</label>
                  <input
                    type="number"
                    value={liters}
                    onChange={(e) => setLiters(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Total Cost</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Odometer (Km)</label>
                  <input
                    type="number"
                    value={odo}
                    onChange={(e) => setOdo(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Purchase Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving...' : 'Record Refuel'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Fuel;
