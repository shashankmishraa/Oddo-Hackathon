import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Trash2, ShieldAlert, Check, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TableFilters } from '../components/TableFilters';
import { canCreate, canDelete } from '../utils/rbac';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Registered Date' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'licenseExpiry', label: 'License Expiry' },
  { value: 'safetyScore', label: 'Safety Rating' },
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export const Drivers: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  // Queries
  const { data: driversResponse, isLoading } = useQuery({
    queryKey: ['drivers', searchTerm, statusFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      const res = await api.get('/drivers', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          sortBy,
          sortOrder,
          page,
          limit: 6,
        },
      });
      return res.data.data;
    },
  });

  const rawDrivers = driversResponse?.data || [];
  const totalPages = driversResponse?.totalPages || 1;

  const drivers = rawDrivers.map((d: any) => ({
    id: d.id,
    name: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Unknown Operator',
    email: d.user ? d.user.email : '',
    licenseNumber: d.licenseNumber,
    licenseExpiry: d.licenseExpiry.split('T')[0],
    safetyScore: d.safetyScore,
    status: d.status,
    contactNumber: d.user?.contactNumber || 'N/A',
  }));

  // Auto-select first driver on data load
  useEffect(() => {
    if (drivers.length > 0) {
      const exists = drivers.some((d: any) => d.id === selectedDriverId);
      if (!exists) {
        setSelectedDriverId(drivers[0].id);
      }
    } else {
      setSelectedDriverId(null);
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
      setTimeout(() => setError(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/drivers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSelectedDriverId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete driver');
    },
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
      status: 'AVAILABLE',
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
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
      case 'ON_TRIP':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40';
      case 'OFF_DUTY':
        return 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-100 dark:border-slate-700';
      default:
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40';
    }
  };

  const selectedDriver = drivers.find((d: any) => d.id === selectedDriverId);
  const role = (user as any)?.role as string | undefined;
  const canAddDriver = canCreate(role, 'driver');
  const canDeleteDriver = canDelete(role, 'driver');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Drivers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage driver information and status</p>
        </div>
        {canAddDriver && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      {/* Table Filters */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search driver name, email, license key..."
        status={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
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
          setSortBy('createdAt');
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
                  <th className="px-6 py-4">Driver Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">License Number</th>
                  <th className="px-6 py-4">License Expiry</th>
                  <th className="px-6 py-4">Safety Rating</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-650 dark:text-slate-350">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No matching drivers found.
                    </td>
                  </tr>
                ) : (
                  drivers.map((d: any) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDriverId(d.id)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer transition-colors ${
                        selectedDriverId === d.id ? 'bg-blue-50/40 dark:bg-blue-900/10 font-semibold text-slate-900 dark:text-white' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{d.name}</td>
                      <td className="px-6 py-4">{d.email}</td>
                      <td className="px-6 py-4 font-mono">{d.licenseNumber}</td>
                      <td className="px-6 py-4">
                        {new Date(d.licenseExpiry) <= new Date() ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center space-x-1">
                            <span>{d.licenseExpiry}</span>
                            <span className="text-[10px] bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/50">EXPIRED</span>
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
                      <td className="px-6 py-4 text-center print:hidden">
                        {canDeleteDriver && (
                          <button
                            onClick={(e) => handleDeleteDriver(d.id, e)}
                            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete driver"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Driver detail panel */}
      {selectedDriver && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 print:hidden">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                  alt="Driver"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedDriver.name}</h2>
                <p className="text-sm text-slate-550 dark:text-slate-400 font-semibold">{selectedDriver.email}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedDriver.status)}`}>
              {selectedDriver.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">LICENSE VALUE</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1 font-mono">{selectedDriver.licenseNumber}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">LICENSE EXPIRATION</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1">{selectedDriver.licenseExpiry}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">CONTACT NUMBER</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1 font-mono">{selectedDriver.contactNumber}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">SAFETY RANKING</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1 font-mono">{selectedDriver.safetyScore.toFixed(2)} / 5.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Add Driver */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Driver</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-250">✕</button>
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

            <form onSubmit={handleAddDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Ishan Shirode"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="ishan@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">License Number</label>
                  <input
                    type="text"
                    placeholder="MH12-202300456"
                    value={licenseNum}
                    onChange={(e) => setLicenseNum(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">License Expiry</label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Safety Rating (1.0 to 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={safetyScore}
                  onChange={(e) => setSafetyScore(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
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
