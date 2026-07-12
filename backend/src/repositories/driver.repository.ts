import { PrismaClient, Driver } from '@prisma/client';
import { DriverStatus } from '../constants/enums';

const prisma = new PrismaClient();

export class DriverRepository {
  async findAll(status?: string): Promise<Driver[]> {
    return prisma.driver.findMany({
      where: status ? { status } : {},
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        trips: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { userId },
    });
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { licenseNumber },
    });
  }

  async create(data: {
    userId: string;
    licenseNumber: string;
    licenseExpiry: Date;
    safetyScore?: number;
    status?: DriverStatus;
  }): Promise<Driver> {
    return prisma.driver.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async update(id: string, data: {
    licenseNumber?: string;
    licenseExpiry?: Date;
    safetyScore?: number;
    status?: DriverStatus;
  }): Promise<Driver> {
    return prisma.driver.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<Driver> {
    return prisma.driver.delete({
      where: { id },
    });
  }
}
export default DriverRepository;
