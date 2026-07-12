import { PrismaClient, Vehicle } from '@prisma/client';
import { VehicleStatus } from '../constants/enums';

const prisma = new PrismaClient();

export class VehicleRepository {
  async findAll(status?: string): Promise<Vehicle[]> {
    return prisma.vehicle.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: true,
        maintenanceLogs: true,
      },
    });
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { registrationNumber },
    });
  }

  async create(data: {
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    status?: VehicleStatus;
  }): Promise<Vehicle> {
    return prisma.vehicle.create({
      data,
    });
  }

  async update(id: string, data: {
    registrationNumber?: string;
    make?: string;
    model?: string;
    year?: number;
    status?: VehicleStatus;
  }): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Vehicle> {
    return prisma.vehicle.delete({
      where: { id },
    });
  }
}
export default VehicleRepository;
