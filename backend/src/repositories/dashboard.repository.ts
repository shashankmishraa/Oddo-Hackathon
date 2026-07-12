import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardRepository {
  async getVehicleStatusCounts() {
    return prisma.vehicle.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });
  }

  async getDriverStatusCounts() {
    return prisma.driver.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });
  }

  async getTripStatusCounts() {
    return prisma.trip.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });
  }

  async getYearlyFuelLogs(year: number) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    return prisma.fuelLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        cost: true,
        liters: true,
        date: true,
      },
    });
  }

  async getYearlyExpenses(year: number) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    return prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        date: true,
      },
    });
  }
}
export default DashboardRepository;
