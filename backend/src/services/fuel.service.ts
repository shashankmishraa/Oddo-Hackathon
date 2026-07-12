import { FuelRepository } from '../repositories/fuel.repository';
import { PrismaClient, FuelLog } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();
const fuelRepo = new FuelRepository();

export class FuelService {
  async getAllLogs(options: any) {
    const { data, total } = await fuelRepo.findAll(options);
    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getLogDetails(id: string): Promise<FuelLog> {
    const log = await fuelRepo.findById(id);
    if (!log) {
      throw new AppError('Fuel log not found', 404);
    }
    return log;
  }

  async createLog(data: {
    vehicleId: string;
    driverId: string;
    liters: number;
    cost: number;
    date: string;
    odometerReading: number;
  }): Promise<FuelLog> {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    return prisma.$transaction(async (tx) => {
      // Update vehicle odometer if this reading is larger
      if (data.odometerReading > vehicle.odometer) {
        await tx.vehicle.update({
          where: { id: data.vehicleId },
          data: { odometer: data.odometerReading },
        });
      }

      return tx.fuelLog.create({
        data: {
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          liters: data.liters,
          cost: data.cost,
          date: new Date(data.date),
          odometerReading: data.odometerReading,
        },
      });
    });
  }

  async updateLog(id: string, data: {
    vehicleId?: string;
    driverId?: string;
    liters?: number;
    cost?: number;
    date?: string;
    odometerReading?: number;
  }): Promise<FuelLog> {
    const log = await fuelRepo.findById(id);
    if (!log) {
      throw new AppError('Fuel log not found', 404);
    }

    const updateData: any = {
      liters: data.liters,
      cost: data.cost,
      date: data.date ? new Date(data.date) : undefined,
      odometerReading: data.odometerReading,
    };

    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) throw new AppError('Vehicle not found', 404);
      updateData.vehicleId = data.vehicleId;
    }

    if (data.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
      if (!driver) throw new AppError('Driver not found', 404);
      updateData.driverId = data.driverId;
    }

    return fuelRepo.update(id, updateData);
  }

  async deleteLog(id: string): Promise<void> {
    const log = await fuelRepo.findById(id);
    if (!log) {
      throw new AppError('Fuel log not found', 404);
    }
    await fuelRepo.delete(id);
  }
}
export default FuelService;
