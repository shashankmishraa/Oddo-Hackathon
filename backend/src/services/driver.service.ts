import { DriverRepository } from '../repositories/driver.repository';
import { PrismaClient, Driver } from '@prisma/client';
import { DriverStatus } from '../constants/enums';
import bcrypt from 'bcrypt';
import { AppError } from '../middlewares/errorHandler';

const driverRepo = new DriverRepository();
const prisma = new PrismaClient();

export class DriverService {
  async listDrivers(options: any) {
    const { data, total } = await driverRepo.findAll(options);
    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getDriver(id: string): Promise<Driver> {
    const driver = await driverRepo.findById(id);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    return driver;
  }

  async registerDriver(data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    licenseExpiry: string;
    safetyScore?: number;
    status?: DriverStatus;
  }): Promise<Driver> {
    // Check existing license
    const existingLicense = await driverRepo.findByLicenseNumber(data.licenseNumber);
    if (existingLicense) {
      throw new AppError('Driver with this license number already registered.', 400);
    }

    // Check existing email
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('User email address already in use.', 400);
    }

    // Resolve role ID for DRIVER
    const driverRole = await prisma.role.findUnique({ where: { name: 'DRIVER' } });
    if (!driverRole) {
      throw new AppError('Driver role classification does not exist. Run db seeder.', 500);
    }

    const passwordHash = await bcrypt.hash(data.password || 'driver123', 10);

    // Create User and Driver in Transaction
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: driverRole.id,
        },
      });

      return tx.driver.create({
        data: {
          userId: user.id,
          licenseNumber: data.licenseNumber,
          licenseExpiry: new Date(data.licenseExpiry),
          safetyScore: data.safetyScore ?? 5.0,
          status: data.status || 'AVAILABLE',
        },
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
    });
  }

  async updateDriver(id: string, data: {
    firstName?: string;
    lastName?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    safetyScore?: number;
    status?: DriverStatus;
  }): Promise<Driver> {
    const driver = await driverRepo.findById(id);
    if (!driver) {
      throw new AppError('Driver profile not found.', 404);
    }

    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const existingLicense = await driverRepo.findByLicenseNumber(data.licenseNumber);
      if (existingLicense) {
        throw new AppError('Driver with this license number already registered.', 400);
      }
    }

    return prisma.$transaction(async (tx) => {
      if (data.firstName || data.lastName) {
        await tx.user.update({
          where: { id: driver.userId },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        });
      }

      return tx.driver.update({
        where: { id },
        data: {
          licenseNumber: data.licenseNumber,
          licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
          safetyScore: data.safetyScore,
          status: data.status,
        },
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
    });
  }

  async removeDriver(id: string): Promise<void> {
    const driver = await driverRepo.findById(id) as any;
    if (!driver) {
      throw new AppError('Driver not found.', 404);
    }

    // Check for active dispatches
    const hasActiveTrips = driver.trips?.some(
      (trip: any) => trip.status === 'SCHEDULED' || trip.status === 'EN_ROUTE'
    );
    if (hasActiveTrips) {
      throw new AppError('Cannot delete driver. Operator is currently assigned to scheduled or active trips.', 400);
    }

    // Cascade deletion of driver profile by deleting base user
    await prisma.user.delete({ where: { id: driver.userId } });
  }
}
export default DriverService;
