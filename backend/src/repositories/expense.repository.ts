import { PrismaClient, Expense } from '@prisma/client';

const prisma = new PrismaClient();

export class ExpenseRepository {
  async findAll(): Promise<Expense[]> {
    return prisma.expense.findMany({
      include: {
        vehicle: true,
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        trip: true,
      },
      orderBy: { date: 'desc' },
    });
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
