import { PrismaClient, Driver } from '@prisma/client';
import { DriverStatus } from '../constants/enums';

const prisma = new PrismaClient();

export class DriverRepository {
  async findAll(options: {
    search?: string;
    status?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    skip: number;
    take: number;
  }) {
    const { search, status, sortBy, sortOrder, skip, take } = options;
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { licenseNumber: { contains: search } },
        {
          user: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
            ],
          },
        },
      ];
    }

    const total = await prisma.driver.count({ where });
    
    // Check if sortBy targets user model relations
    let orderBy: any = {};
    if (sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'email') {
      orderBy = { user: { [sortBy]: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const data = await prisma.driver.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            contactNumber: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    });

    return { data, total };
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
