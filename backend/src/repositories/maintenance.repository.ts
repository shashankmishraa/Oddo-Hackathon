import { PrismaClient, MaintenanceLog } from '@prisma/client';

const prisma = new PrismaClient();

export class MaintenanceRepository {
  async findAll(): Promise<MaintenanceLog[]> {
    return prisma.maintenanceLog.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: string): Promise<MaintenanceLog | null> {
    return prisma.maintenanceLog.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });
  }

  async create(data: {
    vehicleId: string;
    description: string;
    cost: number;
    date: Date;
    status: string;
  }): Promise<MaintenanceLog> {
    return prisma.maintenanceLog.create({
      data,
    });
  }

  async update(id: string, data: {
    description?: string;
    cost?: number;
    date?: Date;
    status?: string;
  }): Promise<MaintenanceLog> {
    return prisma.maintenanceLog.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<MaintenanceLog> {
    return prisma.maintenanceLog.delete({
      where: { id },
    });
  }
}
export default MaintenanceRepository;
