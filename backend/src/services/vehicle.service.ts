import { VehicleRepository } from '../repositories/vehicle.repository';
import { Vehicle } from '@prisma/client';
import { VehicleStatus } from '../constants/enums';
import { AppError } from '../middlewares/errorHandler';

const vehicleRepo = new VehicleRepository();

export class VehicleService {
  async getAllVehicles(status?: string): Promise<Vehicle[]> {
    return vehicleRepo.findAll(status);
  }

  async getVehicleDetails(id: string): Promise<Vehicle> {
    const vehicle = await vehicleRepo.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }
    return vehicle;
  }

  async registerVehicle(data: {
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    status?: VehicleStatus;
  }): Promise<Vehicle> {
    const existing = await vehicleRepo.findByRegistrationNumber(data.registrationNumber);
    if (existing) {
      throw new AppError('Vehicle with this registration number already exists.', 400);
    }
    return vehicleRepo.create(data);
  }

  async updateVehicle(id: string, data: {
    registrationNumber?: string;
    make?: string;
    model?: string;
    year?: number;
    status?: VehicleStatus;
  }): Promise<Vehicle> {
    const vehicle = await vehicleRepo.findById(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
      const existing = await vehicleRepo.findByRegistrationNumber(data.registrationNumber);
      if (existing) {
        throw new AppError('Vehicle with this registration number already exists.', 400);
      }
    }

    return vehicleRepo.update(id, data);
  }

  async removeVehicle(id: string): Promise<void> {
    const vehicle = await vehicleRepo.findById(id) as any;
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    // Safeguard: Check for scheduled or active journeys
    const hasActiveTrips = vehicle.trips?.some(
      (trip: any) => trip.status === 'SCHEDULED' || trip.status === 'EN_ROUTE'
    );
    if (hasActiveTrips) {
      throw new AppError('Cannot delete vehicle. It is currently assigned to active or scheduled trips.', 400);
    }

    await vehicleRepo.delete(id);
  }
}
export default VehicleService;
