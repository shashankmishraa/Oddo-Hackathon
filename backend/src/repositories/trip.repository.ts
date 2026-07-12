import { PrismaClient, Trip } from '@prisma/client';
import { TripStatus } from '../constants/enums';

const prisma = new PrismaClient();

export class TripRepository {
  async findAll(status?: string): Promise<Trip[]> {
    return prisma.trip.findMany({
      where: status ? { status } : {},
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
      orderBy: { createdAt: 'desc' },
    });
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
