import { TripRepository } from '../repositories/trip.repository';
import { PrismaClient, Trip } from '@prisma/client';
import { TripStatus } from '../constants/enums';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();
const tripRepo = new TripRepository();

export class TripService {
  async getAllTrips(status?: string): Promise<Trip[]> {
    return tripRepo.findAll(status);
  }

  async getTripDetails(id: string): Promise<Trip> {
    const trip = await tripRepo.findById(id);
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }
    return trip;
  }

  async scheduleTrip(data: {
    vehicleId: string;
    driverId: string;
    cargo: number;
    departureTime: string;
    arrivalTime: string;
  }): Promise<Trip> {
    // 1. Load vehicle and verify availability
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }
    if (vehicle.status !== 'AVAILABLE') {
      throw new AppError(`Vehicle is not available (Status: ${vehicle.status})`, 400);
    }

    // 2. Load driver and verify availability & license expiry
    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    if (driver.status !== 'AVAILABLE') {
      throw new AppError(`Driver is not available (Status: ${driver.status})`, 400);
    }
    if (new Date(driver.licenseExpiry) <= new Date()) {
      throw new AppError('Driver license has expired.', 400);
    }

    // 3. Verify cargo load capacity limit
    if (data.cargo > vehicle.capacity) {
      throw new AppError(`Trip cargo load (${data.cargo}) exceeds vehicle capacity limit (${vehicle.capacity}).`, 400);
    }

    // 4. Verify no duplicate active assignments
    const activeVehicleTrip = await prisma.trip.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: { in: ['DISPATCHED', 'DRAFT'] },
      },
    });
    if (activeVehicleTrip) {
      throw new AppError('Vehicle is already assigned to an active or scheduled dispatch.', 400);
    }

    const activeDriverTrip = await prisma.trip.findFirst({
      where: {
        driverId: data.driverId,
        status: { in: ['DISPATCHED', 'DRAFT'] },
      },
    });
    if (activeDriverTrip) {
      throw new AppError('Driver is already assigned to an active or scheduled dispatch.', 400);
    }

    return tripRepo.create({
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      cargo: data.cargo,
      departureTime: new Date(data.departureTime),
      arrivalTime: new Date(data.arrivalTime),
      status: 'DRAFT',
    });
  }

  async dispatchTrip(id: string): Promise<Trip> {
    const trip = (await tripRepo.findById(id)) as any;
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }
    if (trip.status !== 'DRAFT') {
      throw new AppError(`Only DRAFT trips can be dispatched (Current status: ${trip.status})`, 400);
    }

    // Re-verify vehicle and driver statuses
    if (trip.vehicle.status !== 'AVAILABLE') {
      throw new AppError('Vehicle is no longer available.', 400);
    }
    if (trip.driver.status !== 'AVAILABLE') {
      throw new AppError('Driver is no longer available.', 400);
    }

    // Dispatch transition
    return prisma.$transaction(async (tx) => {
      // Update statuses
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'ON_TRIP' },
      });

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: 'ON_TRIP' },
      });

      return tx.trip.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          actualDepartureTime: new Date(),
          startOdometer: trip.vehicle.odometer,
        },
      });
    });
  }

  async completeTrip(id: string, data: { endOdometer: number; fuelUsed?: number }): Promise<Trip> {
    const trip = (await tripRepo.findById(id)) as any;
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }
    if (trip.status !== 'DISPATCHED') {
      throw new AppError(`Only DISPATCHED trips can be completed (Current status: ${trip.status})`, 400);
    }

    const startOdo = trip.startOdometer || trip.vehicle.odometer;
    if (data.endOdometer < startOdo) {
      throw new AppError(`End odometer reading (${data.endOdometer}) cannot be less than start odometer (${startOdo})`, 400);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update Vehicle Odometer and Status
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: 'AVAILABLE',
          odometer: data.endOdometer,
        },
      });

      // 2. Update Driver Status
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: 'AVAILABLE' },
      });

      // 3. Create FuelLog if fuel used is provided
      if (data.fuelUsed && data.fuelUsed > 0) {
        await tx.fuelLog.create({
          data: {
            vehicleId: trip.vehicleId,
            driverId: trip.driverId,
            liters: data.fuelUsed,
            cost: data.fuelUsed * 1.5, // Mock fuel price multiplier
            date: new Date(),
            odometerReading: data.endOdometer,
          },
        });
      }

      // 4. Update Trip details
      return tx.trip.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          actualArrivalTime: new Date(),
          endOdometer: data.endOdometer,
          fuelUsed: data.fuelUsed || null,
        },
      });
    });
  }

  async cancelTrip(id: string): Promise<Trip> {
    const trip = (await tripRepo.findById(id)) as any;
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new AppError(`Cannot cancel a ${trip.status} trip.`, 400);
    }

    return prisma.$transaction(async (tx) => {
      // Revert statuses if trip was already dispatched
      if (trip.status === 'DISPATCHED') {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: 'AVAILABLE' },
        });

        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: 'AVAILABLE' },
        });
      }

      return tx.trip.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });
  }

  async removeTrip(id: string): Promise<void> {
    const trip = (await tripRepo.findById(id)) as any;
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }
    if (trip.status === 'DISPATCHED') {
      throw new AppError('Cannot delete a trip that is currently en route.', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Revert statuses if active
      if (trip.status === 'DISPATCHED') {
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } });
      }
      await tx.trip.delete({ where: { id } });
    });
  }
}
export default TripService;
