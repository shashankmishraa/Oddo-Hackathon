import { PrismaClient, MaintenanceLog } from '@prisma/client';

const prisma = new PrismaClient();

export class MaintenanceRepository {
  async findAll(options: {
    search?: string;
    status?: string;
    vehicleId?: string;
    dateRange?: { start?: Date; end?: Date };
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    skip: number;
    take: number;
  }) {
    const { search, status, vehicleId, dateRange, sortBy, sortOrder, skip, take } = options;
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (vehicleId && vehicleId !== 'ALL') {
      where.vehicleId = vehicleId;
    }
    if (dateRange) {
      where.date = {};
      if (dateRange.start) {
        where.date.gte = dateRange.start;
      }
      if (dateRange.end) {
        where.date.lte = dateRange.end;
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { vehicle: { registrationNumber: { contains: search } } },
      ];
    }

    const total = await prisma.maintenanceLog.count({ where });
    const data = await prisma.maintenanceLog.findMany({
      where,
      include: {
        vehicle: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    });

    return { data, total };
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
