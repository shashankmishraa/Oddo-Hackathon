import { PrismaClient, FuelLog } from '@prisma/client';

const prisma = new PrismaClient();

export class FuelRepository {
  async findAll(): Promise<FuelLog[]> {
    return prisma.fuelLog.findMany({
      include: {
        vehicle: true,
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
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
