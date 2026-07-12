import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Compass, CheckCircle2, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TableFilters } from '../components/TableFilters';
import { canCreate, canDelete } from '../utils/rbac';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Time' },
  { value: 'departureTime', label: 'Departure Time' },
  { value: 'arrivalTime', label: 'Arrival Time' },
  { value: 'cargo', label: 'Cargo Load' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft / Scheduled' },
  { value: 'DISPATCHED', label: 'Dispatched / En Route' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const Trips: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modal schedule form stepper states
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form fields
  const [source, setSource] = useState('Mumbai');
  const [destination, setDestination] = useState('Pune');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargo, setCargo] = useState(10);
  const [distance, setDistance] = useState(180);
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

  // Complete Trip form states
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [endOdo, setEndOdo] = useState<number>(0);
  const [fuelUsed, setFuelUsed] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, vehicleFilter, driverFilter, dateStart, dateEnd, sortBy, sortOrder]);

  // Queries
  const { data: tripsResponse, isLoading } = useQuery({
    queryKey: ['trips', searchTerm, statusFilter, vehicleFilter, driverFilter, dateStart, dateEnd, sortBy, sortOrder, page],
    queryFn: async () => {
      const res = await api.get('/trips', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          vehicleId: vehicleFilter !== 'ALL' ? vehicleFilter : undefined,
          driverId: driverFilter !== 'ALL' ? driverFilter : undefined,
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

  const { data: driversResponse } = useQuery({
    queryKey: ['drivers_list'],
    queryFn: async () => {
      const res = await api.get('/drivers', { params: { limit: 100 } });
      return res.data.data?.data || [];
    },
  });

  const trips = tripsResponse?.data || [];
  const totalPages = tripsResponse?.totalPages || 1;
  const vehicles = vehiclesResponse || [];
  const rawDrivers = driversResponse || [];

  const drivers = rawDrivers.map((d: any) => ({
    id: d.id,
    name: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Unknown Operator',
    email: d.user ? d.user.email : '',
    licenseNumber: d.licenseNumber,
    licenseExpiry: d.licenseExpiry.split('T')[0],
    safetyScore: d.safetyScore,
    status: d.status,
  }));

  const availableVehicles = vehicles.filter((v: any) => v.status === 'AVAILABLE');
  const availableDrivers = drivers.filter(
    (d: any) => d.status === 'AVAILABLE' && new Date(d.licenseExpiry) > new Date()
  );

  const selectedVehicle = vehicles.find((v: any) => v.id === vehicleId);
  const selectedDriver = drivers.find((d: any) => d.id === driverId);

  const isVehicleAvailable = !!selectedVehicle && selectedVehicle.status === 'AVAILABLE';
  const isDriverAvailable = !!selectedDriver && selectedDriver.status === 'AVAILABLE';
  const isLicenseValid = !!selectedDriver && new Date(selectedDriver.licenseExpiry) > new Date();
  const isCargoWithinCapacity = !!selectedVehicle && cargo <= selectedVehicle.capacity;
  const allValidationsPassed = isVehicleAvailable && isDriverAvailable && isLicenseValid && isCargoWithinCapacity;

  // Mutations
  const scheduleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/trips', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['drivers_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Trip schedule drafted successfully');
      setTimeout(() => {
        setModalOpen(false);
        setStep(1);
        setSuccess(null);
        setVehicleId('');
        setDriverId('');
        setCargo(10);
        setDistance(180);
        setDepartureTime('');
        setArrivalTime('');
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to schedule trip');
      setTimeout(() => setError(null), 3000);
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/trips/${id}/dispatch`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['drivers_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to dispatch trip');
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.post(`/trips/${id}/complete`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['drivers_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Trip completed successfully.');
      setTimeout(() => {
        setCompleteModalOpen(false);
        setSuccess(null);
        setActiveTripId(null);
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to complete trip');
      setTimeout(() => setError(null), 3000);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/trips/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles_list'] });
      queryClient.invalidateQueries({ queryKey: ['drivers_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to cancel trip');
    },
  });

  const handleScheduleTrip = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehicleId || !driverId || !departureTime || !arrivalTime) {
      setError('Please verify all details and validations are correct before dispatching');
      return;
    }

    scheduleMutation.mutate({
      vehicleId,
      driverId,
      cargo,
      departureTime: new Date(departureTime).toISOString(),
      arrivalTime: new Date(arrivalTime).toISOString(),
    });
  };

  const handleDispatch = (id: string) => {
    dispatchMutation.mutate(id);
  };

  const promptComplete = (id: string) => {
    const trip = trips.find((t: any) => t.id === id);
    if (!trip) return;
    const v = vehicles.find((veh: any) => veh.id === trip.vehicleId);

    setActiveTripId(id);
    setEndOdo(v ? v.odometer + 150 : 0);
    setFuelUsed(45);
    setCompleteModalOpen(true);
  };

  const handleCompleteTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTripId) return;
    setError(null);
    setSuccess(null);

    completeMutation.mutate({
      id: activeTripId,
      payload: {
        endOdometer: endOdo,
        fuelUsed,
      },
    });
  };

  const handleCancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this scheduled trip?')) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
      case 'DISPATCHED':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40';
      case 'COMPLETED':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
      default:
        return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40';
    }
  };

  const role = (user as any)?.role as string | undefined;
  const canAddTrip = canCreate(role, 'trip');
  const canDeleteTrip = canDelete(role, 'trip');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Trips</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Schedule, dispatch, and track active logistics trips</p>
        </div>
        {canAddTrip && (
          <button
            onClick={() => {
              setModalOpen(true);
              setStep(1);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Schedule Trip</span>
          </button>
        )}
      </div>

      {/* Reusable Filters */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by vehicle reg number or driver name..."
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
          setStatusFilter('ALL');
          setVehicleFilter('ALL');
          setDriverFilter('ALL');
          setDateStart('');
          setDateEnd('');
          setSortBy('createdAt');
          setSortOrder('desc');
          setPage(1);
        }}
        onExportPDF={() => window.print()}
      />

      {/* Trips list table */}
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
                  <th className="px-6 py-4">Trip Route ID</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4 font-mono">Cargo</th>
                  <th className="px-6 py-4">Departure Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center print:hidden">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-650 dark:text-slate-350">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No matching trips found.
                    </td>
                  </tr>
                ) : (
                  trips.map((t: any) => {
                    const veh = vehicles.find((v: any) => v.id === t.vehicleId);
                    const drv = drivers.find((d: any) => d.id === t.driverId);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold">
                          <span className="text-slate-400 dark:text-slate-500 text-xs mr-0.5">TRIP-</span>
                          {t.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{veh?.make} {veh?.model.split(' (')[0]}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{veh?.registrationNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{drv?.name || 'Unknown Driver'}</p>
                          <p className="text-xs text-slate-405 dark:text-slate-500 font-semibold">{drv?.email}</p>
                        </td>
                        <td className="px-6 py-4 font-mono">{t.cargo} Tons</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{new Date(t.departureTime).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{new Date(t.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${getStatusBadge(t.status)}`}>
                            {t.status === 'DRAFT' ? 'SCHEDULED' : t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center print:hidden">
                          {canDeleteTrip && (
                            <div className="flex items-center justify-center space-x-1.5">
                              {t.status === 'DRAFT' && (
                                <>
                                  <button
                                    onClick={() => handleDispatch(t.id)}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-1"
                                  >
                                    <Compass size={11} />
                                    <span>Dispatch</span>
                                  </button>
                                  <button
                                    onClick={() => handleCancel(t.id)}
                                    className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-rose-650 hover:bg-rose-50/20 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {t.status === 'DISPATCHED' && (
                                <button
                                  onClick={() => promptComplete(t.id)}
                                  className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center space-x-1"
                                >
                                  <CheckCircle2 size={11} />
                                  <span>Complete</span>
                                </button>
                              )}
                              {(t.status === 'COMPLETED' || t.status === 'CANCELLED') && (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Archive</span>
                              )}
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

      {/* Modal - Schedule Trip */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Schedule Logistics Dispatch</h2>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">Step {step} of 3</p>
              </div>
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

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Source Terminal</label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Destination Hub</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Cargo Cargo Tonnage (Tons)</label>
                    <input
                      type="number"
                      value={cargo}
                      onChange={(e) => setCargo(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Trip Distance (Km)</label>
                    <input
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
                >
                  Continue to Asset Assignment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Fleet Vehicle</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  >
                    <option value="">-- Choose available asset --</option>
                    {availableVehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model.split(' (')[0]} ({v.registrationNumber}) - Capacity: {v.capacity}T
                      </option>
                    ))}
                  </select>
                  {selectedVehicle && (
                    <div className="mt-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 text-xs space-y-1.5">
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase">Plates Match:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{selectedVehicle.registrationNumber}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase">Weight Limits Capacity:</span>
                        <span className={`font-mono font-bold ${isCargoWithinCapacity ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {cargo}T / {selectedVehicle.capacity}T ({isCargoWithinCapacity ? 'OK' : 'LIMIT EXCEEDED'})
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Operator Driver</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                  >
                    <option value="">-- Choose active operator --</option>
                    {availableDrivers.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (License: {d.licenseNumber}) - Rating: {d.safetyScore.toFixed(1)}★
                      </option>
                    ))}
                  </select>
                  {selectedDriver && (
                    <div className="mt-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 text-xs space-y-1.5">
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase">License Validity Status:</span>
                        <span className={`font-bold ${isLicenseValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                          Expires {selectedDriver.licenseExpiry} ({isLicenseValid ? 'VALID' : 'EXPIRED'})
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={!vehicleId || !driverId}
                    onClick={() => setStep(3)}
                    className="w-2/3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    Continue to Schedule
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Scheduled Departure</label>
                    <input
                      type="datetime-local"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Est. Arrival Target</label>
                    <input
                      type="datetime-local"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 text-xs space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase">Dispatch Checklists Summary</h4>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase">Asset Status Match:</span>
                    <span className={isVehicleAvailable ? 'text-emerald-600 font-bold' : 'text-rose-650 font-bold'}>{isVehicleAvailable ? 'AVAILABLE' : 'RESERVED'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase">Operator Status Match:</span>
                    <span className={isDriverAvailable ? 'text-emerald-600 font-bold' : 'text-rose-650 font-bold'}>{isDriverAvailable ? 'AVAILABLE' : 'ON DUTY'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase">Capacity Limits Check:</span>
                    <span className={isCargoWithinCapacity ? 'text-emerald-600 font-bold' : 'text-rose-655 font-bold'}>{isCargoWithinCapacity ? 'VERIFIED' : 'OVERLOAD'}</span>
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleScheduleTrip}
                    disabled={!allValidationsPassed || scheduleMutation.isPending}
                    className="w-2/3 py-3 rounded-xl bg-emerald-650 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal - Complete Trip */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Completed Dispatch</h2>
              <button onClick={() => setCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-850">✕</button>
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

            <form onSubmit={handleCompleteTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">End Odometer Reading (Km)</label>
                <input
                  type="number"
                  value={endOdo}
                  onChange={(e) => setEndOdo(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Total Fuel Spent (Liters)</label>
                <input
                  type="number"
                  value={fuelUsed}
                  onChange={(e) => setFuelUsed(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={completeMutation.isPending}
                className="w-full py-3 rounded-xl bg-emerald-650 hover:bg-emerald-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {completeMutation.isPending ? 'Submitting...' : 'Register Completion'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Trips;
