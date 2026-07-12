export type Role = 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'VIEWER';
export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
export type TripStatus = 'SCHEDULED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED';
export type IncidentType = 'DELAY' | 'ACCIDENT' | 'BREAKDOWN' | 'WEATHER' | 'OTHER';
export type IncidentStatus = 'REPORTED' | 'RESOLVED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  type: string;
  capacity: number;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  licenseNumber: string;
  status: DriverStatus;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  estimatedDuration: number;
  stops: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  routeId: string;
  route: Route;
  vehicleId: string;
  vehicle: Vehicle;
  driverId: string;
  driver: Driver;
  status: TripStatus;
  departureTime: string;
  arrivalTime: string;
  actualDepartureTime: string | null;
  actualArrivalTime: string | null;
  createdAt: string;
  updatedAt: string;
  incidents?: Incident[];
}

export interface Incident {
  id: string;
  tripId: string;
  trip?: Trip;
  reporterId: string;
  reporter?: User;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}
