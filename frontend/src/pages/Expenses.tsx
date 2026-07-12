import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Check, ShieldAlert, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { TableFilters } from '../components/TableFilters';
import { canCreate, canDelete } from '../utils/rbac';

const SORT_OPTIONS = [
  { value: 'date', label: 'Expense Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'category', label: 'Category' },
];

const CATEGORY_OPTIONS = [
  { value: 'TOLL', label: 'Tolls & Taxes' },
  { value: 'FUEL', label: 'Fuel / Diesel' },
  { value: 'MAINTENANCE', label: 'Maintenance & Spares' },
  { value: 'INSURANCE', label: 'Insurance Premium' },
  { value: 'PERMIT', label: 'Permit Fees' },
  { value: 'MISC', label: 'Miscellaneous' },
];

export const Expenses: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState(10);
  const [category, setCategory] = useState('TOLL');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [tripId, setTripId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, vehicleFilter, driverFilter, dateStart, dateEnd, sortBy, sortOrder]);

  // Queries
  const { data: expensesResponse, isLoading } = useQuery({
    queryKey: ['expenses', searchTerm, categoryFilter, vehicleFilter, driverFilter, dateStart, dateEnd, sortBy, sortOrder, page],
    queryFn: async () => {
      const res = await api.get('/expenses', {
        params: {
          search: searchTerm || undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
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

  const { data: tripsResponse } = useQuery({
    queryKey: ['trips_list'],
    queryFn: async () => {
      const res = await api.get('/trips', { params: { limit: 100 } });
      return res.data.data?.data || [];
    },
  });

  const expenses = expensesResponse?.data || [];
  const totalPages = expensesResponse?.totalPages || 1;
  const vehicles = vehiclesResponse || [];
  const rawDrivers = driversResponse || [];
  const trips = tripsResponse || [];

  const drivers = rawDrivers.map((d: any) => ({
    id: d.id,
    name: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Unknown Operator',
  }));

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/expenses', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Expense logged successfully.');
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(null);
        setAmount(10);
        setCategory('TOLL');
        setDescription('');
        setVehicleId('');
        setDriverId('');
        setTripId('');
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to log operational expense');
      setTimeout(() => setError(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/expenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete expense log');
    },
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (amount <= 0 || !category || !description) {
      setError('Please provide valid amount, category, and description');
      return;
    }

    createMutation.mutate({
      amount,
      category,
      description,
      date: new Date(date).toISOString(),
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      tripId: tripId || null,
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Delete this expense entry permanently?')) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'FUEL':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40';
      case 'MAINTENANCE':
        return 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
      case 'INSURANCE':
        return 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40';
      case 'PERMIT':
        return 'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-100 dark:border-slate-700';
    }
  };

  const role = (user as any)?.role as string | undefined;
  const canAddExpense = canCreate(role, 'expense');
  const canDeleteExpense = canDelete(role, 'expense');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Expenses</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and audit fleet expenditures, toll logs, and maintenance invoices</p>
        </div>
        {canAddExpense && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Record Expense</span>
          </button>
        )}
      </div>

      {/* Reusable Filters */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search expense description, vehicle reg..."
        status={categoryFilter}
        onStatusChange={setCategoryFilter}
        statusOptions={CATEGORY_OPTIONS}
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
          setCategoryFilter('ALL');
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

      {/* Expenses ledger table list */}
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
                  <th className="px-6 py-4">Expense Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Associated Vehicle</th>
                  <th className="px-6 py-4">Associated Driver</th>
                  <th className="px-6 py-4 text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-650 dark:text-slate-350">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No ledger expenses logged.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e: any) => {
                    const veh = vehicles.find((v: any) => v.id === e.vehicleId);
                    const drv = drivers.find((d: any) => d.id === e.driverId);

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${getCategoryColor(e.category)}`}>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{e.description}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(e.amount)}</td>
                        <td className="px-6 py-4 font-mono">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-mono text-xs">{veh ? veh.registrationNumber : 'N/A'}</td>
                        <td className="px-6 py-4 text-xs font-semibold">{drv ? drv.name : 'N/A'}</td>
                        <td className="px-6 py-4 text-center print:hidden">
                          {canDeleteExpense && (
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Delete ledger entry"
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

      {/* Modal - Record Expense */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Expense</h2>
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

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Amount (INR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-semibold"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="Toll tax at Mumbai-Pune expressway..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Associated Vehicle (Optional)</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  >
                    <option value="">-- None --</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.registrationNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Associated Driver (Optional)</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  >
                    <option value="">-- None --</option>
                    {drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Associated Trip ID (Optional)</label>
                  <select
                    value={tripId}
                    onChange={(e) => setTripId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                  >
                    <option value="">-- None --</option>
                    {trips.map((t: any) => (
                      <option key={t.id} value={t.id}>TRIP-{t.id.slice(0, 8).toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Log Date</label>
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
                {createMutation.isPending ? 'Logging...' : 'Record Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Expenses;
