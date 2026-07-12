import { PrismaClient, Trip } from '@prisma/client';
import { TripStatus } from '../constants/enums';

const prisma = new PrismaClient();

export class TripRepository {
  async findAll(options: {
    search?: string;
    status?: string;
    vehicleId?: string;
    driverId?: string;
    dateRange?: { start?: Date; end?: Date };
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    skip: number;
    take: number;
  }) {
    const { search, status, vehicleId, driverId, dateRange, sortBy, sortOrder, skip, take } = options;
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (vehicleId && vehicleId !== 'ALL') {
      where.vehicleId = vehicleId;
    }
    if (driverId && driverId !== 'ALL') {
      where.driverId = driverId;
    }
    if (dateRange) {
      where.departureTime = {};
      if (dateRange.start) {
        where.departureTime.gte = dateRange.start;
      }
      if (dateRange.end) {
        where.departureTime.lte = dateRange.end;
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
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

    const total = await prisma.trip.count({ where });
    const data = await prisma.trip.findMany({
      where,
      include: {
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    });

    return { data, total };
  }

  async findById(id: string): Promise<Trip | null> {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: {
    vehicleId: string;
    driverId: string;
    cargo: number;
    departureTime: Date;
    arrivalTime: Date;
    status?: string;
  }): Promise<Trip> {
    return prisma.trip.create({
      data,
    });
  }

  async update(id: string, data: {
    vehicleId?: string;
    driverId?: string;
    status?: TripStatus;
    cargo?: number;
    departureTime?: Date;
    arrivalTime?: Date;
    actualDepartureTime?: Date | null;
    actualArrivalTime?: Date | null;
    startOdometer?: number;
    endOdometer?: number;
    fuelUsed?: number;
  }): Promise<Trip> {
    return prisma.trip.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Trip> {
    return prisma.trip.delete({
      where: { id },
    });
  }
}
export default TripRepository;
