import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Compass, CheckCircle2, XCircle, ShieldAlert, Check } from 'lucide-react';
import { Trip, Vehicle, Driver } from '../services/mockData';

export const Trips: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal schedule form stepper states
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1); // Steps: 1, 2, 3
  
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

  // Queries
  const { data: tripsResponse, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get('/trips');
      return res.data.data as Trip[];
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

  const trips = tripsResponse || [];
  const vehicles = vehiclesResponse || [];
  const drivers = driversResponse || [];

  const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE');
  const availableDrivers = drivers.filter(
    (d) => d.status === 'AVAILABLE' && new Date(d.licenseExpiry) > new Date()
  );

  // Real-time validations checks
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedDriver = drivers.find((d) => d.id === driverId);

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
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
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
    }
  });

  const dispatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/trips/${id}/dispatch`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to dispatch trip');
    }
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.post(`/trips/${id}/complete`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setSuccess('Trip completed successfully. Vehicle odometer and fuel logs updated.');
      setTimeout(() => {
        setCompleteModalOpen(false);
        setSuccess(null);
        setActiveTripId(null);
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to complete trip');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/trips/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to cancel trip');
    }
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
      arrivalTime: new Date(arrivalTime).toISOString()
    });
  };

  const handleDispatch = (id: string) => {
    dispatchMutation.mutate(id);
  };

  const promptComplete = (id: string) => {
    const trip = trips.find((t) => t.id === id) as any;
    if (!trip) return;
    const v = vehicles.find((veh) => veh.id === trip.vehicleId);

    setActiveTripId(id);
    setEndOdo(v ? v.odometer + 100 : 0);
    setFuelUsed(20);
    setCompleteModalOpen(true);
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!activeTripId) return;

    completeMutation.mutate({
      id: activeTripId,
      payload: {
        endOdometer: endOdo,
        fuelUsed: fuelUsed || undefined
      }
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
        return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'DISPATCHED':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      default:
        return 'bg-rose-50 text-rose-600 border border-rose-100';
    }
  };

  const filteredTrips = trips.filter((t) => {
    const vehicle = vehicles.find((v) => v.id === t.vehicleId);
    const driver = drivers.find((d) => d.id === t.driverId);
    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : '';
    const driverName = driver ? driver.name : '';

    const matchesSearch =
      vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Trips & Scheduling</h1>
          <p className="text-slate-500 mt-1 font-medium">Schedule journeys, allocate assets, and track statuses</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Schedule Trip</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search trips by driver name or vehicle model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft / Scheduled</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 flex h-48 items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="col-span-2 bg-white border border-slate-200 p-12 text-center text-slate-400 font-medium rounded-3xl shadow-sm">
            No matching dispatches found.
          </div>
        ) : (
          filteredTrips.map((t) => {
            const v = vehicles.find((veh) => veh.id === t.vehicleId);
            const d = drivers.find((drv) => drv.id === t.driverId);
            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 font-mono">{v?.registrationNumber}</h3>
                    <p className="text-sm text-slate-500 font-semibold">{v?.make} {v?.model.split(' (')[0]}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${getStatusBadge(t.status)}`}>
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                  <div className="space-y-1">
                    <p className="text-slate-450 uppercase tracking-wider">Driver</p>
                    <p className="text-slate-800 text-sm">{d?.name || 'Unassigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-450 uppercase tracking-wider">Cargo Load</p>
                    <p className="text-slate-800 text-sm">{t.cargo} Tons</p>
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-slate-100 pt-3">
                    <p className="text-slate-450 uppercase tracking-wider mb-1">Schedule Time</p>
                    <p className="text-slate-700">Dep: {new Date(t.departureTime).toLocaleString()}</p>
                    <p className="text-slate-700">Arr: {new Date(t.arrivalTime).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-slate-100">
                  {t.status === 'DRAFT' && (
                    <button
                      onClick={() => handleDispatch(t.id)}
                      disabled={dispatchMutation.isPending}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <Compass size={14} />
                      <span>Dispatch Trip</span>
                    </button>
                  )}

                  {t.status === 'DISPATCHED' && (
                    <button
                      onClick={() => promptComplete(t.id)}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                    >
                      <CheckCircle2 size={14} />
                      <span>Complete Trip</span>
                    </button>
                  )}

                  {(t.status === 'DRAFT' || t.status === 'DISPATCHED') && (
                    <button
                      onClick={() => handleCancel(t.id)}
                      disabled={cancelMutation.isPending}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      <span>Cancel</span>
                    </button>
                  )}

                  {(t.status === 'COMPLETED' || t.status === 'CANCELLED') && (
                    <div className="text-slate-400 text-xs py-2 w-full text-center font-bold">
                      Historical log record locked
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal - Register/Schedule Trip Wizard */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Create Trip</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center space-x-8 text-xs font-bold border-b border-slate-100 pb-4">
              <span className={`pb-2 border-b-2 px-2 transition-all ${step === 1 ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-400'}`}>
                1. Trip Details
              </span>
              <span className={`pb-2 border-b-2 px-2 transition-all ${step === 2 ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-400'}`}>
                2. Assign Vehicle & Driver
              </span>
              <span className={`pb-2 border-b-2 px-2 transition-all ${step === 3 ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-400'}`}>
                3. Review & Dispatch
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stepper Content form area */}
              <div className="md:col-span-2 space-y-4">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Source</label>
                        <input
                          type="text"
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Destination</label>
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Cargo Weight (Tons)</label>
                        <input
                          type="number"
                          value={cargo}
                          onChange={(e) => setCargo(parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Planned Distance (Km)</label>
                        <input
                          type="number"
                          value={distance}
                          onChange={(e) => setDistance(parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Expected Start Date</label>
                        <input
                          type="datetime-local"
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Expected End Date</label>
                        <input
                          type="datetime-local"
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all"
                    >
                      Next: Assign Assets
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Vehicle</label>
                      <select
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none"
                      >
                        <option value="">-- Choose vehicle --</option>
                        {availableVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.registrationNumber} - {v.make} {v.model} (Cap: {v.capacity}T)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Driver</label>
                      <select
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none"
                      >
                        <option value="">-- Choose driver --</option>
                        {availableDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (Safety Score: {d.safetyScore})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        disabled={!vehicleId || !driverId}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all disabled:opacity-50"
                      >
                        Next: Review Summary
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm space-y-2">
                      <p className="font-semibold text-slate-700">Please confirm dispatches parameters:</p>
                      <p className="text-slate-600">Route: <span className="font-bold text-slate-900">{source} ⇄ {destination}</span></p>
                      <p className="text-slate-600">Transit dates: <span className="font-bold text-slate-900">{departureTime} to {arrivalTime}</span></p>
                      <p className="text-slate-600">Assigned operator: <span className="font-bold text-slate-900">{selectedDriver?.name || 'None'}</span></p>
                      <p className="text-slate-600">Assigned truck plates: <span className="font-bold text-slate-900">{selectedVehicle?.registrationNumber || 'None'}</span></p>
                    </div>

                    {error && (
                      <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-semibold">
                        <ShieldAlert size={14} />
                        <span>{error}</span>
                      </div>
                    )}

                    {success && (
                      <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-xl text-xs font-semibold">
                        <Check size={14} />
                        <span>{success}</span>
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleScheduleTrip}
                        disabled={!allValidationsPassed || scheduleMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all disabled:opacity-50"
                      >
                        {scheduleMutation.isPending ? 'Scheduling...' : 'Draft & Dispatch'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stepper validation and Summary cards sidebar (exactly like image wizard) */}
              <div className="space-y-4">
                {/* Validation Checks */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Validation Checks</h3>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Vehicle Available</span>
                      {isVehicleAvailable ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-300" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Driver Available</span>
                      {isDriverAvailable ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-300" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">License Valid</span>
                      {isLicenseValid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-300" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Cargo &lt;= Capacity</span>
                      {isCargoWithinCapacity ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-300" />}
                    </div>
                  </div>
                  {allValidationsPassed && (
                    <p className="text-[10px] text-emerald-600 font-extrabold uppercase bg-emerald-50 py-1.5 px-3 rounded-lg text-center tracking-wide">
                      # All validations passed!
                    </p>
                  )}
                </div>

                {/* Trip Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-2 shadow-sm text-xs font-bold">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trip Summary</h3>
                  <p className="text-slate-500">Source: <span className="text-slate-800">{source}</span></p>
                  <p className="text-slate-500">Destination: <span className="text-slate-800">{destination}</span></p>
                  <p className="text-slate-500">Cargo Weight: <span className="text-slate-800">{cargo} Tons</span></p>
                  <p className="text-slate-500">Distance: <span className="text-slate-800">{distance} Km</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Complete Trip Journey</h2>
              <button onClick={() => setCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-800">✕</button>
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

            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">End Odometer Reading (Km)</label>
                <input
                  type="number"
                  value={endOdo}
                  onChange={(e) => setEndOdo(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Fuel Used (Liters, Optional)</label>
                <input
                  type="number"
                  value={fuelUsed}
                  onChange={(e) => setFuelUsed(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={completeMutation.isPending}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-sm transition-all disabled:opacity-50"
              >
                {completeMutation.isPending ? 'Completing...' : 'Close & Complete'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Trips;
