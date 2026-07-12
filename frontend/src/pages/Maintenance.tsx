import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Check, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { TableFilters } from '../components/TableFilters';
import { canCreate, canDelete } from '../utils/rbac';

const SORT_OPTIONS = [
  { value: 'date', label: 'Log Date' },
  { value: 'cost', label: 'Estimated Cost' },
  { value: 'status', label: 'Status' },
];

const STATUS_OPTIONS = [
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'RESOLVED', label: 'Resolved' },
];

export const Maintenance: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Modal Open Maintenance states
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(100);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal Close Maintenance states
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [finalCost, setFinalCost] = useState(100);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, vehicleFilter, dateStart, dateEnd, sortBy, sortOrder]);

  // Queries
  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['maintenance', searchTerm, statusFilter, vehicleFilter, dateStart, dateEnd, sortBy, sortOrder, page],
    queryFn: async () => {
      const res = await api.get('/maintenance', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          vehicleId: vehicleFilter !== 'ALL' ? vehicleFilter : undefined,
          dateStart: dateStart || undefined,
          dateEnd: dateEnd || undefined,
          sortBy,
          sortOrder,
          page,
          limit: 6,
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

  const logs = logsResponse?.data || [];
  const totalPages = logsResponse?.totalPages || 1;
  const vehicles = vehiclesResponse || [];

  // Auto-select first log
  useEffect(() => {
    if (logs.length > 0) {
      const exists = logs.some((l: any) => l.id === selectedLogId);
      if (!exists) {
        setSelectedLogId(logs[0].id);
      }
    } else {
      setSelectedLogId(null);
    }
  }, [logs, selectedLogId]);

  const activeVehicles = vehicles.filter((v: any) => v.status !== 'RETIRED');

  // Mutations
  const openMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/maintenance', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Maintenance log opened. Vehicle status changed to In Shop.');
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(null);
        setVehicleId('');
        setDescription('');
        setCost(100);
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to open maintenance log');
      setTimeout(() => setError(null), 3000);
    },
  });

  const closeMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.post(`/maintenance/${id}/close`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Maintenance log completed. Vehicle returned to Available status.');
      setTimeout(() => {
        setCloseModalOpen(false);
        setSuccess(null);
        setActiveLogId(null);
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to close maintenance log');
      setTimeout(() => setError(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/maintenance/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSelectedLogId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete maintenance log');
    },
  });

  const handleOpenMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehicleId || !description || !date || !cost) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    openMutation.mutate({
      vehicleId,
      description,
      cost,
      date: new Date(date).toISOString(),
    });
  };

  const handleCloseMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogId) return;
    setError(null);
    setSuccess(null);

    closeMutation.mutate({
      id: activeLogId,
      payload: {
        cost: finalCost,
      },
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this maintenance record permanently?')) {
      deleteMutation.mutate(id);
    }
  };

  const promptClose = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const log = logs.find((l: any) => l.id === id);
    if (!log) return;
    setActiveLogId(id);
    setFinalCost(log.cost);
    setCloseModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNDER_MAINTENANCE':
        return 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
      case 'RESOLVED':
        return 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-100 dark:border-slate-700';
    }
  };

  const selectedLog = logs.find((l: any) => l.id === selectedLogId);
  const role = (user as any)?.role as string | undefined;
  const canAddMaintenance = canCreate(role, 'maintenance');
  const canDeleteMaintenance = canDelete(role, 'maintenance');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Maintenance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Monitor vehicle servicing, shop schedules, and maintenance logs</p>
        </div>
        {canAddMaintenance && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Open Job Card</span>
          </button>
        )}
      </div>

      {/* Reusable Filters */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search maintenance descriptions or vehicle plates..."
        status={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        extraDropdowns={[
          {
            value: vehicleFilter,
            onChange: setVehicleFilter,
            options: vehicles.map((v: any) => ({ value: v.id, label: v.registrationNumber })),
            placeholder: 'All Vehicles',
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
          setStatusFilter('ALL');
          setVehicleFilter('ALL');
          setDateStart('');
          setDateEnd('');
          setSortBy('date');
          setSortOrder('desc');
          setPage(1);
        }}
        onExportPDF={() => window.print()}
      />

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
                  <th className="px-6 py-4">Vehicle Asset</th>
                  <th className="px-6 py-4">Service Description</th>
                  <th className="px-6 py-4">Log Date</th>
                  <th className="px-6 py-4">Est. Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center print:hidden">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-650 dark:text-slate-350">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No maintenance logs recorded.
                    </td>
                  </tr>
                ) : (
                  logs.map((l: any) => {
                    const veh = vehicles.find((v: any) => v.id === l.vehicleId);

                    return (
                      <tr
                        key={l.id}
                        onClick={() => setSelectedLogId(l.id)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/40 cursor-pointer transition-colors ${
                          selectedLogId === l.id ? 'bg-blue-50/40 dark:bg-blue-900/10 font-semibold text-slate-900 dark:text-white' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{veh?.make} {veh?.model.split(' (')[0]}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{veh?.registrationNumber}</p>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">{l.description}</td>
                        <td className="px-6 py-4 font-mono">{new Date(l.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-mono">{formatCurrency(l.cost)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${getStatusBadge(l.status)}`}>
                            {l.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center print:hidden">
                          {canDeleteMaintenance && (
                            <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                              {l.status === 'UNDER_MAINTENANCE' && (
                                <button
                                  onClick={(e) => promptClose(l.id, e)}
                                  className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center space-x-1"
                                >
                                  <CheckCircle size={11} />
                                  <span>Resolve</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(l.id, e)}
                                className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Remove Job"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
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

      {/* Selected Job Card details panel */}
      {selectedLog && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 print:hidden">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Maintenance Job Card Details</h2>
              <p className="text-sm text-slate-400 dark:text-slate-555 mt-0.5">Reference ID: {selectedLog.id.toUpperCase()}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedLog.status)}`}>
              {selectedLog.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">LOG DATE</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1">{new Date(selectedLog.date).toLocaleDateString()}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">TOTAL SERVICE COST</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1 font-mono">{formatCurrency(selectedLog.cost)}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl col-span-2">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">WORK SCOPE DESCRIPTION</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1">{selectedLog.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Open Maintenance */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Open Maintenance Job</h2>
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

            <form onSubmit={handleOpenMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Fleet Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                >
                  <option value="">-- Choose active asset --</option>
                  {activeVehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model.split(' (')[0]} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Service Description</label>
                <textarea
                  placeholder="Engine oil change, brake pads replacement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Estimated Cost</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Job Date</label>
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
                disabled={openMutation.isPending}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {openMutation.isPending ? 'Opening...' : 'Open Job Card'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Close Maintenance */}
      {closeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resolve Maintenance Job</h2>
              <button onClick={() => setCloseModalOpen(false)} className="text-slate-400 hover:text-slate-850">✕</button>
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

            <form onSubmit={handleCloseMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Final Invoice Cost</label>
                <input
                  type="number"
                  value={finalCost}
                  onChange={(e) => setFinalCost(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={closeMutation.isPending}
                className="w-full py-3 rounded-xl bg-emerald-650 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Closing...' : 'Close Job Card'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Maintenance;
