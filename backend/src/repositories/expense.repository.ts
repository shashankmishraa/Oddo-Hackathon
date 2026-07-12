import { PrismaClient, Expense } from '@prisma/client';

const prisma = new PrismaClient();

export class ExpenseRepository {
  async findAll(options: {
    search?: string;
    category?: string;
    vehicleId?: string;
    driverId?: string;
    dateRange?: { start?: Date; end?: Date };
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    skip: number;
    take: number;
  }) {
    const { search, category, vehicleId, driverId, dateRange, sortBy, sortOrder, skip, take } = options;
    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }
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
        { description: { contains: search } },
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

    const total = await prisma.expense.count({ where });
    const data = await prisma.expense.findMany({
      where,
      include: {
        vehicle: true,
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        trip: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    });

    return { data, total };
  }

  async findById(id: string): Promise<Expense | null> {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        trip: true,
      },
    });
  }

  async create(data: {
    amount: number;
    category: string;
    description: string;
    date: Date;
    vehicleId?: string | null;
    tripId?: string | null;
    driverId?: string | null;
  }): Promise<Expense> {
    return prisma.expense.create({
      data,
    });
  }

  async update(id: string, data: {
    amount?: number;
    category?: string;
    description?: string;
    date?: Date;
    vehicleId?: string | null;
    tripId?: string | null;
    driverId?: string | null;
  }): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Expense> {
    return prisma.expense.delete({
      where: { id },
    });
  }
}
export default ExpenseRepository;
