import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Search, Plus, Trash2, ShieldAlert, Check, Star } from 'lucide-react';
import { Driver } from '../services/mockData';

export const Drivers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [safetyScore, setSafetyScore] = useState(5.0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Queries
  const { data: driversResponse, isLoading } = useQuery({
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

  const drivers = driversResponse || [];

  // Auto-select first driver
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriverId) {
      setSelectedDriverId(drivers[0].id);
    }
  }, [drivers, selectedDriverId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/drivers', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Driver registered successfully');
      setName('');
      setEmail('');
      setLicenseNum('');
      setLicenseExpiry('');
      setSafetyScore(5.0);
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(null);
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to register driver');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/drivers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      if (selectedDriverId === deleteMutation.variables) {
        setSelectedDriverId(null);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete driver');
    }
  });

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !licenseNum || !licenseExpiry) {
      setError('Please fill in all mandatory fields');
      return;
    }

    const [firstName, ...lastNameArr] = name.trim().split(' ');
    const lastName = lastNameArr.join(' ') || 'Operator';

    createMutation.mutate({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      licenseNumber: licenseNum.trim().toUpperCase(),
      licenseExpiry: new Date(licenseExpiry).toISOString(),
      safetyScore,
      status: 'AVAILABLE'
    });
  };

  const handleDeleteDriver = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this driver profile?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'ON_TRIP':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'OFF_DUTY':
        return 'bg-slate-50 text-slate-650 border border-slate-100';
      default:
        return 'bg-rose-50 text-rose-600 border border-rose-100';
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Drivers</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage driver information and status</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Driver</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search driver name, email, license key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
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
                  <th className="px-6 py-4">Driver Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">License Number</th>
                  <th className="px-6 py-4">License Expiry</th>
                  <th className="px-6 py-4">Safety Rating</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No matching drivers found.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDriverId(d.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        selectedDriverId === d.id ? 'bg-blue-50/40 font-semibold text-slate-900' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">{d.name}</td>
                      <td className="px-6 py-4">{d.email}</td>
                      <td className="px-6 py-4 font-mono">{d.licenseNumber}</td>
                      <td className="px-6 py-4">
                        {new Date(d.licenseExpiry) <= new Date() ? (
                          <span className="text-rose-600 font-bold flex items-center space-x-1">
                            <span>{d.licenseExpiry}</span>
                            <span className="text-[10px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">EXPIRED</span>
                          </span>
                        ) : (
                          <span>{d.licenseExpiry}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5 text-amber-500">
                          <Star size={14} className="fill-amber-500" />
                          <span className="font-bold font-mono">{d.safetyScore.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${getStatusBadge(d.status)}`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => handleDeleteDriver(d.id, e)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete driver"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Driver detail panel (exactly like driver card in image) */}
      {selectedDriver && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                <img
                  src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`}
                  alt="Driver"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedDriver.name}</h2>
                <p className="text-sm text-slate-500 font-semibold">{selectedDriver.email}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedDriver.status)}`}>
              {selectedDriver.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold">LICENSE NUMBER</p>
              <p className="font-semibold text-slate-800 mt-1 font-mono">{selectedDriver.licenseNumber}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold">LICENSE CATEGORY</p>
              <p className="font-semibold text-slate-800 mt-1">Heavy Motor Vehicle (HMV)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold">LICENSE EXPIRY</p>
              <p className="font-semibold text-slate-800 mt-1 font-mono">{selectedDriver.licenseExpiry}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400 font-bold">SAFETY RATING</p>
              <div className="flex items-center space-x-1 text-amber-500 mt-1 font-bold">
                <Star size={16} className="fill-amber-500" />
                <span>{selectedDriver.safetyScore.toFixed(1)} / 5.0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Register Driver */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Driver</h2>
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

            <form onSubmit={handleAddDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Driver Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  placeholder="john@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">License Number</label>
                  <input
                    type="text"
                    placeholder="DL-987654"
                    value={licenseNum}
                    onChange={(e) => setLicenseNum(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">License Expiry</label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Initial Safety Score (0.0 to 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="5.0"
                  value={safetyScore}
                  onChange={(e) => setSafetyScore(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'Registering...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Drivers;
