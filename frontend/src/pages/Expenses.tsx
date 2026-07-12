import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Check, ShieldAlert } from 'lucide-react';
import { Expense, Vehicle, Driver, Trip } from '../services/mockData';
import { formatCurrency } from '../utils/format';

export const Expenses: React.FC = () => {
  const queryClient = useQueryClient();

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

  // Queries
  const { data: expensesResponse, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/expenses');
      return res.data.data as Expense[];
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

  const { data: tripsResponse } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get('/trips');
      return res.data.data as Trip[];
    }
  });

  const expenses = expensesResponse || [];
  const vehicles = vehiclesResponse || [];
  const drivers = driversResponse || [];
  const trips = tripsResponse || [];

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
    }
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (amount <= 0 || !category || !description || !date) {
      setError('Please fill in all mandatory fields with valid values');
      return;
    }

    createMutation.mutate({
      amount,
      category,
      description: description.trim(),
      date: new Date(date).toISOString(),
      vehicleId: vehicleId || undefined,
      driverId: driverId || undefined,
      tripId: tripId || undefined
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Expenses Ledger</h1>
          <p className="text-slate-500 mt-1 font-medium">Track operational expenditures, toll receipts, and repair costs</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Record Expense</span>
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
                  <th className="px-6 py-4">Expense Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount (₹)</th>
                  <th className="px-6 py-4">Linked Asset</th>
                  <th className="px-6 py-4">Linked Operator</th>
                  <th className="px-6 py-4">Expense Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No expenditures logged in ledger.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => {
                    const v = vehicles.find((veh) => veh.id === exp.vehicleId);
                    const d = drivers.find((drv) => drv.id === exp.driverId);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 uppercase tracking-wide">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{exp.description}</td>
                        <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{formatCurrency(exp.amount)}</td>
                        <td className="px-6 py-4 font-mono text-xs">{v?.registrationNumber || 'None'}</td>
                        <td className="px-6 py-4 font-semibold text-xs">{d?.name || 'None'}</td>
                        <td className="px-6 py-4 font-mono">{exp.date.split('T')[0]}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Record Expense</h2>
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

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  >
                    <option value="TOLL">Toll Fee</option>
                    <option value="FUEL">Fuel Refill</option>
                    <option value="REPAIR">Repair / Maintenance</option>
                    <option value="MEALS">Meals & Lodging</option>
                    <option value="OTHER">Other Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="Highway state toll pass, lunch log..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Expense Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Link Vehicle (Optional)</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  >
                    <option value="">-- No vehicle link --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.registrationNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Link Driver (Optional)</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  >
                    <option value="">-- No driver link --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Link Trip (Optional)</label>
                  <select
                    value={tripId}
                    onChange={(e) => setTripId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                  >
                    <option value="">-- No trip link --</option>
                    {trips.map((t) => {
                      const v = vehicles.find((veh) => veh.id === t.vehicleId);
                      return (
                        <option key={t.id} value={t.id}>
                          {v?.registrationNumber} ({t.status})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'Recording...' : 'Record Expense Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Expenses;
