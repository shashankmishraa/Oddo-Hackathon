import { PrismaClient, Vehicle } from '@prisma/client';
import { VehicleStatus } from '../constants/enums';

const prisma = new PrismaClient();

export class VehicleRepository {
  async findAll(options: {
    search?: string;
    status?: string;
    region?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    skip: number;
    take: number;
  }) {
    const { search, status, region, sortBy, sortOrder, skip, take } = options;
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { registrationNumber: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } },
      ];
    }

    if (region && region !== 'ALL') {
      where.model = { contains: `(${region})` };
    }

    const total = await prisma.vehicle.count({ where });
    const data = await prisma.vehicle.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
      include: {
        documents: true,
      },
    });

    return { data, total };
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
