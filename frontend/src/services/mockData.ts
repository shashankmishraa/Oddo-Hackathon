// Standalone state simulation layer using LocalStorage

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
  odometer: number;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  safetyScore: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  cargo: number;
  departureTime: string;
  arrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  startOdometer?: number;
  endOdometer?: number;
  fuelUsed?: number;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  date: string;
  status: 'OPEN' | 'CLOSED';
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  liters: number;
  cost: number;
  date: string;
  odometerReading: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  vehicleId?: string;
  tripId?: string;
  driverId?: string;
}

// Initial Data Population
const defaultVehicles: Vehicle[] = [
  { id: 'v1', registrationNumber: 'AB-1234', make: 'Volvo', model: 'VNL 860', year: 2022, capacity: 50, status: 'AVAILABLE', odometer: 12500.0 },
  { id: 'v2', registrationNumber: 'CD-5678', make: 'Freightliner', model: 'Cascadia', year: 2021, capacity: 40, status: 'ON_TRIP', odometer: 48000.0 },
  { id: 'v3', registrationNumber: 'EF-9012', make: 'Kenworth', model: 'T680', year: 2023, capacity: 60, status: 'IN_SHOP', odometer: 5200.0 }
];

const defaultDrivers: Driver[] = [
  { id: 'd1', name: 'John Doe', email: 'john@transitops.com', licenseNumber: 'DL-987654', licenseExpiry: '2028-12-31', safetyScore: 4.8, status: 'AVAILABLE' },
  { id: 'd2', name: 'Jane Smith', email: 'jane@transitops.com', licenseNumber: 'DL-123456', licenseExpiry: '2027-06-15', safetyScore: 4.9, status: 'ON_TRIP' },
  { id: 'd3', name: 'Bob Johnson', email: 'bob@transitops.com', licenseNumber: 'DL-888888', licenseExpiry: '2026-05-10', safetyScore: 4.2, status: 'OFF_DUTY' }
];

const defaultTrips: Trip[] = [
  { id: 't1', vehicleId: 'v2', driverId: 'd2', cargo: 25, departureTime: '2026-07-12T08:00', arrivalTime: '2026-07-12T16:00', status: 'DISPATCHED', startOdometer: 47900.0 },
  { id: 't2', vehicleId: 'v1', driverId: 'd1', cargo: 35, departureTime: '2026-07-13T10:00', arrivalTime: '2026-07-13T18:00', status: 'DRAFT' }
];

const defaultMaintenance: MaintenanceLog[] = [
  { id: 'm1', vehicleId: 'v3', description: 'Brake Pads Replacement', cost: 450, date: '2026-07-11', status: 'OPEN' }
];

const defaultFuel: FuelLog[] = [
  { id: 'f1', vehicleId: 'v2', driverId: 'd2', liters: 120, cost: 180, odometerReading: 47800.0, date: '2026-07-10' }
];

const defaultExpenses: Expense[] = [
  { id: 'e1', amount: 45, category: 'TOLL', description: 'Highway Gate Pass', date: '2026-07-12', vehicleId: 'v2', tripId: 't1', driverId: 'd2' }
];

export const initializeMockData = () => {
  if (!localStorage.getItem('to_vehicles')) {
    localStorage.setItem('to_vehicles', JSON.stringify(defaultVehicles));
    localStorage.setItem('to_drivers', JSON.stringify(defaultDrivers));
    localStorage.setItem('to_trips', JSON.stringify(defaultTrips));
    localStorage.setItem('to_maintenance', JSON.stringify(defaultMaintenance));
    localStorage.setItem('to_fuel', JSON.stringify(defaultFuel));
    localStorage.setItem('to_expenses', JSON.stringify(defaultExpenses));
  }
};

export const getVehicles = (): Vehicle[] => {
  initializeMockData();
  return JSON.parse(localStorage.getItem('to_vehicles') || '[]');
};

export const saveVehicles = (list: Vehicle[]) => {
  localStorage.setItem('to_vehicles', JSON.stringify(list));
};

export const getDrivers = (): Driver[] => {
  initializeMockData();
  return JSON.parse(localStorage.getItem('to_drivers') || '[]');
};

export const saveDrivers = (list: Driver[]) => {
  localStorage.setItem('to_drivers', JSON.stringify(list));
};

export const getTrips = (): Trip[] => {
  initializeMockData();
  return JSON.parse(localStorage.getItem('to_trips') || '[]');
};

export const saveTrips = (list: Trip[]) => {
  localStorage.setItem('to_trips', JSON.stringify(list));
};

export const getMaintenance = (): MaintenanceLog[] => {
  initializeMockData();
  return JSON.parse(localStorage.getItem('to_maintenance') || '[]');
};

export const saveMaintenance = (list: MaintenanceLog[]) => {
  localStorage.setItem('to_maintenance', JSON.stringify(list));
};

export const getFuel = (): FuelLog[] => {
  initializeMockData();
  return JSON.parse(localStorage.getItem('to_fuel') || '[]');
};

export const saveFuel = (list: FuelLog[]) => {
  localStorage.setItem('to_fuel', JSON.stringify(list));
};

export const getExpenses = (): Expense[] => {
  initializeMockData();
  return JSON.parse(localStorage.getItem('to_expenses') || '[]');
};

export const saveExpenses = (list: Expense[]) => {
  localStorage.setItem('to_expenses', JSON.stringify(list));
};
