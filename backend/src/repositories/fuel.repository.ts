import { PrismaClient, FuelLog } from '@prisma/client';

const prisma = new PrismaClient();

export class FuelRepository {
  async findAll(options: {
    search?: string;
    vehicleId?: string;
    driverId?: string;
    dateRange?: { start?: Date; end?: Date };
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    skip: number;
    take: number;
  }) {
    const { search, vehicleId, driverId, dateRange, sortBy, sortOrder, skip, take } = options;
    const where: any = {};

    if (vehicleId && vehicleId !== 'ALL') {
      where.vehicleId = vehicleId;
    }
    if (driverId && driverId !== 'ALL') {
      where.driverId = driverId;
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
        { vehicle: { registrationNumber: { contains: search } } },
        {
          driver: {
            user: {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
              ],
            },
          },
        },
      ];
    }

    const total = await prisma.fuelLog.count({ where });
    const data = await prisma.fuelLog.findMany({
      where,
      include: {
        vehicle: true,
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    });

    return { data, total };
  }

  async findById(id: string): Promise<FuelLog | null> {
    return prisma.fuelLog.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async create(data: {
    vehicleId: string;
    driverId: string;
    liters: number;
    cost: number;
    date: Date;
    odometerReading: number;
  }): Promise<FuelLog> {
    return prisma.fuelLog.create({
      data,
    });
  }

  async update(id: string, data: {
    vehicleId?: string;
    driverId?: string;
    liters?: number;
    cost?: number;
    date?: Date;
    odometerReading?: number;
  }): Promise<FuelLog> {
    return prisma.fuelLog.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<FuelLog> {
    return prisma.fuelLog.delete({
      where: { id },
    });
  }
}
export default FuelRepository;
