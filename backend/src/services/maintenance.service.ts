import { MaintenanceRepository } from '../repositories/maintenance.repository';
import { PrismaClient, MaintenanceLog } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();
const maintenanceRepo = new MaintenanceRepository();

export class MaintenanceService {
  async getAllLogs(options: any) {
    const { data, total } = await maintenanceRepo.findAll(options);
    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getLogDetails(id: string): Promise<MaintenanceLog> {
    const log = await maintenanceRepo.findById(id);
    if (!log) {
      throw new AppError('Maintenance log not found', 404);
    }
    return log;
  }

  async openMaintenance(data: {
    vehicleId: string;
    description: string;
    cost: number;
    date: string;
  }): Promise<MaintenanceLog> {
    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    if (vehicle.status === 'RETIRED') {
      throw new AppError('Cannot open maintenance for a retired vehicle.', 400);
    }

    // Open maintenance and update vehicle status
    return prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: 'IN_SHOP' },
      });

      return tx.maintenanceLog.create({
        data: {
          vehicleId: data.vehicleId,
          description: data.description,
          cost: data.cost,
          date: new Date(data.date),
          status: 'OPEN',
        },
      });
    });
  }

  async closeMaintenance(id: string, data: { cost?: number }): Promise<MaintenanceLog> {
    const log = await maintenanceRepo.findById(id);
    if (!log) {
      throw new AppError('Maintenance log not found', 404);
    }

    if (log.status === 'CLOSED') {
      throw new AppError('Maintenance log is already closed.', 400);
    }

    // Close maintenance and return vehicle to available unless retired
    return prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
      
      if (vehicle && vehicle.status !== 'RETIRED') {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }

      return tx.maintenanceLog.update({
        where: { id },
        data: {
          status: 'CLOSED',
          cost: data.cost ?? undefined,
        },
      });
    });
  }

  async deleteLog(id: string): Promise<void> {
    const log = await maintenanceRepo.findById(id);
    if (!log) {
      throw new AppError('Maintenance log not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      if (log.status === 'OPEN') {
        const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
        if (vehicle && vehicle.status === 'IN_SHOP') {
          await tx.vehicle.update({
            where: { id: log.vehicleId },
            data: { status: 'AVAILABLE' },
          });
        }
      }

      await tx.maintenanceLog.delete({ where: { id } });
    });
  }
}
export default MaintenanceService;
