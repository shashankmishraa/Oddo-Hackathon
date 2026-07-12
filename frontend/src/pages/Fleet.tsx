import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Search, Plus, Trash2, ShieldAlert, Check } from 'lucide-react';
import { Vehicle } from '../services/mockData';
import { formatCurrency } from '../utils/format';

export const Fleet: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  // Queries
  const { data: vehiclesResponse, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data.data as Vehicle[];
    }
  });

  const vehicles = vehiclesResponse || [];

  // Automatically select the first vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
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
      setError(err.response?.data?.message || 'Failed to register vehicle');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/vehicles/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      if (selectedVehicleId === deleteMutation.variables) {
        setSelectedVehicleId(null);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete vehicle');
    }
  });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!regNum || !make || !model) {
      setError('Please fill in all mandatory fields');
      return;
    }

    createMutation.mutate({
      registrationNumber: regNum.trim().toUpperCase(),
      make: make.trim(),
      model: model.trim(),
      year,
      capacity
    });
  };

  const handleDeleteVehicle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row select
    if (window.confirm('Are you sure you want to delete this vehicle asset?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'ON_TRIP':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'IN_SHOP':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-650 border border-slate-100';
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Vehicles</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and monitor all fleet vehicles</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all font-semibold text-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Reg. No., Name or Type..."
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
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {/* Asset Table list */}
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
                  <th className="px-6 py-4">Reg Number</th>
                  <th className="px-6 py-4">Make / Model</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Capacity (Tons)</th>
                  <th className="px-6 py-4">Odometer (Km)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No matching vehicles found.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        selectedVehicleId === v.id ? 'bg-blue-50/40 font-semibold text-slate-900' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">{v.registrationNumber}</td>
                      <td className="px-6 py-4">{v.make} {v.model}</td>
                      <td className="px-6 py-4">{v.year}</td>
                      <td className="px-6 py-4">{v.capacity}</td>
                      <td className="px-6 py-4 font-mono">{v.odometer.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${getStatusBadge(v.status)}`}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => handleDeleteVehicle(v.id, e)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete vehicle"
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

      {/* Selected Vehicle details panel (exactly like the split layout in the image collage) */}
      {selectedVehicle && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedVehicle.make} {selectedVehicle.model.split(' (')[0]}
              </h2>
              <p className="text-sm font-mono text-slate-500 font-bold">{selectedVehicle.registrationNumber}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedVehicle.status)}`}>
              {selectedVehicle.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">VEHICLE TYPE</p>
                <p className="font-semibold text-slate-800 mt-1">{selectedVehicle.make}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">MAX LOAD CAPACITY</p>
                <p className="font-semibold text-slate-800 mt-1">{selectedVehicle.capacity} Tons</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">ODOMETER READING</p>
                <p className="font-semibold text-slate-800 mt-1 font-mono">{selectedVehicle.odometer.toLocaleString()} Km</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">ACQUISITION COST</p>
                <p className="font-semibold text-slate-800 mt-1 font-mono">{formatCurrency(selectedVehicle.capacity * 105000)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">ACQUIRED ON</p>
                <p className="font-semibold text-slate-800 mt-1">12 Jan {selectedVehicle.year}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">FUEL SYSTEM</p>
                <p className="font-semibold text-slate-800 mt-1">Diesel Engine</p>
              </div>
            </div>

            {/* Vehicle image block */}
            <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-3xl relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400"
                alt="Transit Vehicle"
                className="max-h-36 object-contain rounded-xl mix-blend-multiply filter contrast-125"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal - Register Vehicle Asset */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Vehicle</h2>
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

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Registration Plates (Unique)</label>
                <input
                  type="text"
                  placeholder="AB-1234"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Model</label>
                  <input
                    type="text"
                    placeholder="VNL 860"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Capacity (Tons)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-250 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
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
