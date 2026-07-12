import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Check, ShieldAlert } from 'lucide-react';
import { FuelLog, Vehicle, Driver } from '../services/mockData';

export const Fuel: React.FC = () => {
  const queryClient = useQueryClient();

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

  // Queries
  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['fuel'],
    queryFn: async () => {
      const res = await api.get('/fuel');
      return res.data.data as FuelLog[];
    }
  });

  const { data: vehiclesResponse } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data.data as Vehicle[];
    }
  });

  const { data: driversResponse } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await api.get('/drivers');
      return (res.data.data || []).map((d: any) => ({
        id: d.id,
        name: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Unknown Operator',
        email: d.user ? d.user.email : '',
        licenseNumber: d.licenseNumber,
        licenseExpiry: d.licenseExpiry.split('T')[0],
        safetyScore: d.safetyScore,
        status: d.status
      })) as Driver[];
    }
  });

  const logs = logsResponse || [];
  const vehicles = vehiclesResponse || [];
  const drivers = driversResponse || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/fuel', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
    }
  });

  const handleRecordFuel = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehicleId || !driverId || liters <= 0 || cost <= 0 || odo <= 0) {
      setError('Please fill in all mandatory fields with valid values');
      return;
    }

    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
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
      date: new Date(date).toISOString(),
      odometerReading: odo
    });
  };

  // Calculations for summary card
  const totalLiters = logs.reduce((sum, l) => sum + l.liters, 0);
  const totalCost = logs.reduce((sum, l) => sum + l.cost, 0);
  const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Fuel Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Track fuel fills, log expenditures, and compute mileage costs</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Record Fuel</span>
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
                  <th className="px-6 py-4">Operator / Driver</th>
                  <th className="px-6 py-4">Volume (Liters)</th>
                  <th className="px-6 py-4">Expenditure ($)</th>
                  <th className="px-6 py-4">Odometer Reading</th>
                  <th className="px-6 py-4">Fill Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No fuel logs recorded.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const v = vehicles.find((veh) => veh.id === log.vehicleId);
                    const d = drivers.find((drv) => drv.id === log.driverId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">{v?.registrationNumber}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{d?.name || 'Unknown Operator'}</td>
                        <td className="px-6 py-4 font-mono">{log.liters.toLocaleString()} L</td>
                        <td className="px-6 py-4 font-mono text-emerald-600 font-bold">${log.cost.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono">{log.odometerReading.toLocaleString()} Km</td>
                        <td className="px-6 py-4 font-mono">{log.date.split('T')[0]}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fuel Summary Card (identical to bottom Fuel logs card in image collage) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Fuel Summary (This Month)</h2>
          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-bold">TOTAL FUEL</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{totalLiters.toLocaleString()} L</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">TOTAL COST</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">${totalCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">AVG. COST / LITER</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">${avgCostPerLiter.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Pump Illustration card */}
        <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden self-start md:self-auto">
          <img
            src="https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&q=80&w=250"
            alt="Fuel Pump"
            className="max-h-24 object-contain rounded-xl"
          />
        </div>
      </div>

      {/* Modal - Record Fuel Receipt */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Record Fuel Receipt</h2>
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

            <form onSubmit={handleRecordFuel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => {
                    setVehicleId(e.target.value);
                    const selected = vehicles.find((v) => v.id === e.target.value);
                    if (selected) setOdo(selected.odometer);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                >
                  <option value="">-- Choose active asset --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.make} {v.model} (Odo: {v.odometer} Km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                >
                  <option value="">-- Choose active driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Status: {d.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Fuel Volume (Liters)</label>
                  <input
                    type="number"
                    value={liters}
                    onChange={(e) => setLiters(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Fuel Cost ($)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Odometer Reading (Km)</label>
                  <input
                    type="number"
                    value={odo}
                    onChange={(e) => setOdo(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Date</label>
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
                disabled={createMutation.isPending}
                className="w-full py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'Recording...' : 'Record fuel log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Fuel;
