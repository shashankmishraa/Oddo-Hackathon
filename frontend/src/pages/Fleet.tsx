import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Trash2, ShieldAlert, Check } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { TableFilters } from '../components/TableFilters';
import { DocumentManager } from '../components/DocumentManager';
import { canCreate, canDelete } from '../utils/rbac';

const REGIONS = [
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Pune', label: 'Pune' },
  { value: 'Nashik', label: 'Nashik' },
  { value: 'Ahmedabad', label: 'Ahmedabad' },
  { value: 'Surat', label: 'Surat' },
  { value: 'Indore', label: 'Indore' },
  { value: 'Nagpur', label: 'Nagpur' },
  { value: 'Bangalore', label: 'Bangalore' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'registrationNumber', label: 'Registration Plate' },
  { value: 'make', label: 'Make' },
  { value: 'model', label: 'Model' },
  { value: 'odometer', label: 'Mileage' },
  { value: 'year', label: 'Year' },
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'IN_SHOP', label: 'In Shop' },
  { value: 'RETIRED', label: 'Retired' },
];

export const Fleet: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [regNum, setRegNum] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [capacity, setCapacity] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, regionFilter, sortBy, sortOrder]);

  // Queries
  const { data: vehiclesResponse, isLoading } = useQuery({
    queryKey: ['vehicles', searchTerm, statusFilter, regionFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      const res = await api.get('/vehicles', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          region: regionFilter !== 'ALL' ? regionFilter : undefined,
          sortBy,
          sortOrder,
          page,
          limit: 6,
        },
      });
      return res.data.data;
    },
  });

  const vehicles = vehiclesResponse?.data || [];
  const totalPages = vehiclesResponse?.totalPages || 1;

  // Automatically select the first vehicle when page data changes
  useEffect(() => {
    if (vehicles.length > 0) {
      // Keep selected vehicle if it's still in the current page
      const exists = vehicles.some((v: any) => v.id === selectedVehicleId);
      if (!exists) {
        setSelectedVehicleId(vehicles[0].id);
      }
    } else {
      setSelectedVehicleId(null);
    }
  }, [vehicles, selectedVehicleId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/vehicles', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Vehicle registered successfully');
      setRegNum('');
      setMake('');
      setModel('');
      setYear(new Date().getFullYear());
      setCapacity(50);
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(null);
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Registration failed');
      setTimeout(() => setError(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/vehicles/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSelectedVehicleId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Deletion failed');
    },
  });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!regNum || !make || !model || !year || !capacity) {
      setError('All fields are required.');
      return;
    }

    createMutation.mutate({
      registrationNumber: regNum,
      make,
      model,
      year,
      capacity,
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this vehicle asset?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
      case 'ON_TRIP':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40';
      case 'IN_SHOP':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-100 dark:border-slate-700';
    }
  };

  const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId);
  const role = (user as any)?.role as string | undefined;
  const canAddVehicle = canCreate(role, 'vehicle');
  const canDeleteVehicle = canDelete(role, 'vehicle');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Vehicles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and monitor all fleet vehicles</p>
        </div>
        {canAddVehicle && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Reusable Filters */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search vehicles make, model or plate..."
        status={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        extraDropdowns={[
          {
            value: regionFilter,
            onChange: setRegionFilter,
            options: REGIONS,
            placeholder: 'All Cities/Regions',
          },
        ]}
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
          setRegionFilter('ALL');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        onExportPDF={() => window.print()}
      />

      {/* Asset Table list */}
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
                  <th className="px-6 py-4">Reg Number</th>
                  <th className="px-6 py-4">Make / Model</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Capacity (Tons)</th>
                  <th className="px-6 py-4">Odometer (Km)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-650 dark:text-slate-300">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No matching vehicles found.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v: any) => (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer transition-colors ${
                        selectedVehicleId === v.id ? 'bg-blue-50/40 dark:bg-blue-900/10 font-semibold text-slate-900 dark:text-white' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono font-bold">{v.registrationNumber}</td>
                      <td className="px-6 py-4">{v.make} {v.model.split(' (')[0]}</td>
                      <td className="px-6 py-4 font-mono">{v.year}</td>
                      <td className="px-6 py-4 font-mono">{v.capacity} Tons</td>
                      <td className="px-6 py-4 font-mono">{v.odometer.toLocaleString()} Km</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${getStatusBadge(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center print:hidden">
                        {canDeleteVehicle && (
                          <button
                            onClick={(e) => handleDelete(v.id, e)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Remove Asset"
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

      {/* Selected Vehicle details panel */}
      {selectedVehicle && !isLoading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 print:hidden">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedVehicle.make} {selectedVehicle.model.split(' (')[0]}
              </h2>
              <p className="text-sm font-mono text-slate-500 dark:text-slate-400 font-bold">{selectedVehicle.registrationNumber}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedVehicle.status)}`}>
              {selectedVehicle.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">VEHICLE TYPE</p>
                <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1">{selectedVehicle.make}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">MAX LOAD CAPACITY</p>
                <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1">{selectedVehicle.capacity} Tons</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">ODOMETER READING</p>
                <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1 font-mono">{selectedVehicle.odometer.toLocaleString()} Km</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">ACQUISITION COST</p>
                <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1 font-mono">{formatCurrency(selectedVehicle.capacity * 105000)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">ACQUIRED ON</p>
                <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1">12 Jan {selectedVehicle.year}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">FUEL SYSTEM</p>
                <p className="font-semibold text-slate-850 dark:text-slate-200 mt-1">Diesel Engine</p>
              </div>
            </div>

            {/* Vehicle image block */}
            <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-3xl relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400"
                alt="Transit Vehicle"
                className="max-h-36 object-contain rounded-xl mix-blend-multiply filter contrast-125 dark:brightness-90"
              />
            </div>
          </div>

          {/* Nested Documents Management Drawer Panel */}
          <DocumentManager vehicleId={selectedVehicle.id} isAdminOrDispatcher={canAddVehicle} />
        </div>
      )}

      {/* Modal - Register Vehicle Asset */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Vehicle</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">✕</button>
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

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Registration Plates (Unique)</label>
                <input
                  type="text"
                  placeholder="AB-1234"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Make</label>
                  <input
                    type="text"
                    placeholder="Volvo"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Model</label>
                  <input
                    type="text"
                    placeholder="VNL 860"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Capacity (Tons)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  />
                </div>
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
export default Fleet;
