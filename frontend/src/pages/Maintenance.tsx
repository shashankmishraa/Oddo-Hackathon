import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Check, ShieldAlert, CheckCircle } from 'lucide-react';
import { MaintenanceLog, Vehicle } from '../services/mockData';
import { formatCurrency } from '../utils/format';

export const Maintenance: React.FC = () => {
  const queryClient = useQueryClient();
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

  // Queries
  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await api.get('/maintenance');
      return res.data.data as MaintenanceLog[];
    }
  });

  const { data: vehiclesResponse } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data.data as Vehicle[];
    }
  });

  const logs = logsResponse || [];
  const vehicles = vehiclesResponse || [];

  // Auto-select first log
  useEffect(() => {
    if (logs.length > 0 && !selectedLogId) {
      setSelectedLogId(logs[0].id);
    }
  }, [logs, selectedLogId]);

  const activeVehicles = vehicles.filter((v) => v.status !== 'RETIRED');

  // Mutations
  const openMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/maintenance', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
    }
  });

  const closeMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.post(`/maintenance/${id}/close`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
    }
  });

  const handleOpenMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehicleId || !description || !date) {
      setError('Please fill in all mandatory fields');
      return;
    }

    openMutation.mutate({
      vehicleId,
      description: description.trim(),
      cost,
      date: new Date(date).toISOString()
    });
  };

  const promptClose = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const log = logs.find((l) => l.id === id);
    if (!log) return;
    setActiveLogId(id);
    setFinalCost(log.cost);
    setCloseModalOpen(true);
  };

  const handleCloseMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!activeLogId) return;

    closeMutation.mutate({
      id: activeLogId,
      payload: {
        cost: finalCost
      }
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'OPEN'
      ? 'bg-amber-50 text-amber-600 border border-amber-100'
      : 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  };

  const selectedLog = logs.find((l) => l.id === selectedLogId);
  const selectedVehicle = selectedLog ? vehicles.find((v) => v.id === selectedLog.vehicleId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Maintenance Logs</h1>
          <p className="text-slate-500 mt-1 font-medium">Track and manage vehicle maintenance logs</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Maintenance</span>
        </button>
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
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Vehicle Plates</th>
                  <th className="px-6 py-4">Make / Model</th>
                  <th className="px-6 py-4">Repair Description</th>
                  <th className="px-6 py-4">Repair Date</th>
                  <th className="px-6 py-4">Estimate Cost (₹)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No active maintenance logs.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const v = vehicles.find((veh) => veh.id === log.vehicleId);
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLogId(log.id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedLogId === log.id ? 'bg-blue-50/40 font-semibold text-slate-900' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">{v?.registrationNumber}</td>
                        <td className="px-6 py-4">{v?.make} {v?.model.split(' (')[0]}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{log.description}</td>
                        <td className="px-6 py-4 font-mono">{log.date.split('T')[0]}</td>
                        <td className="px-6 py-4 font-mono">{formatCurrency(log.cost)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${getStatusBadge(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {log.status === 'OPEN' ? (
                            <button
                              onClick={(e) => promptClose(log.id, e)}
                              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 text-xs font-bold transition-all mx-auto"
                            >
                              <CheckCircle size={12} />
                              <span>Complete & Close</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">Historical Record</span>
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

      {/* Selected Maintenance detail card (exactly like Maintenance details in reference image collage) */}
      {selectedLog && selectedVehicle && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Maintenance - {selectedVehicle.make} {selectedVehicle.model.split(' (')[0]}
              </h2>
              <p className="text-sm font-mono text-slate-500 font-bold">{selectedVehicle.registrationNumber}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedLog.status)}`}>
              {selectedLog.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">SERVICE TYPE</p>
                <p className="font-semibold text-slate-800 mt-1">{selectedLog.description.split(' ')[0]} Maintenance</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">DESCRIPTION</p>
                <p className="font-semibold text-slate-800 mt-1">{selectedLog.description}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">REPAIR START DATE</p>
                <p className="font-semibold text-slate-800 mt-1 font-mono">{selectedLog.date.split('T')[0]}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">REPAIR ESTIMATE COST</p>
                <p className="font-semibold text-slate-800 mt-1 font-mono">{formatCurrency(selectedLog.cost)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">ASSIGNED MECHANIC</p>
                <p className="font-semibold text-slate-800 mt-1">Suresh Patil (Senior Mechanic)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">NEXT ROUTINE CHECK</p>
                <p className="font-semibold text-slate-800 mt-1">25 Aug 2026</p>
              </div>
            </div>

            {/* Mechanic/Repair theme illustration card */}
            <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-3xl relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400"
                alt="Mechanic Service"
                className="max-h-36 object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal - Open Maintenance Request */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Open Maintenance</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>

            {error && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                <ShieldAlert size={16} />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-600">
                <Check size={16} />
                <p className="font-semibold">{success}</p>
              </div>
            )}

            <form onSubmit={handleOpenMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                >
                  <option value="">-- Choose active asset --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.make} {v.model} (Status: {v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Repair Description</label>
                <input
                  type="text"
                  placeholder="Engine oil change, tire replacement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Log Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={openMutation.isPending}
                className="w-full py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm transition-all disabled:opacity-50"
              >
                {openMutation.isPending ? 'Submitting...' : 'Open Repair Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {closeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Close Repair Log</h2>
              <button onClick={() => setCloseModalOpen(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>

            {error && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                <ShieldAlert size={16} />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-600">
                <Check size={16} />
                <p className="font-semibold">{success}</p>
              </div>
            )}

            <form onSubmit={handleCloseMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Final Repair Cost (₹)</label>
                <input
                  type="number"
                  value={finalCost}
                  onChange={(e) => setFinalCost(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={closeMutation.isPending}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-sm transition-all disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Closing...' : 'Complete & Close Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Maintenance;
