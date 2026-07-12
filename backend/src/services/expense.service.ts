import { ExpenseRepository } from '../repositories/expense.repository';
import { PrismaClient, Expense } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();
const expenseRepo = new ExpenseRepository();

export class ExpenseService {
  async getAllExpenses(options: any) {
    const { data, total } = await expenseRepo.findAll(options);
    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getExpenseDetails(id: string): Promise<Expense> {
    const expense = await expenseRepo.findById(id);
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
    return expense;
  }

  async createExpense(data: {
    amount: number;
    category: string;
    description: string;
    date: string;
    vehicleId?: string | null;
    tripId?: string | null;
    driverId?: string | null;
  }): Promise<Expense> {
    // Validate relations if passed
    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) throw new AppError('Vehicle not found', 404);
    }
    if (data.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
      if (!trip) throw new AppError('Trip not found', 404);
    }
    if (data.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
      if (!driver) throw new AppError('Driver not found', 404);
    }

    return expenseRepo.create({
      ...data,
      date: new Date(data.date),
    });
  }

  async updateExpense(id: string, data: {
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    vehicleId?: string | null;
    tripId?: string | null;
    driverId?: string | null;
  }): Promise<Expense> {
    const expense = await expenseRepo.findById(id);
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    const updateData: any = {
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: data.date ? new Date(data.date) : undefined,
      vehicleId: data.vehicleId,
      tripId: data.tripId,
      driverId: data.driverId,
    };

    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) throw new AppError('Vehicle not found', 404);
    }
    if (data.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
      if (!trip) throw new AppError('Trip not found', 404);
    }
    if (data.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
      if (!driver) throw new AppError('Driver not found', 404);
    }

    return expenseRepo.update(id, updateData);
  }

  async deleteExpense(id: string): Promise<void> {
    const expense = await expenseRepo.findById(id);
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
    await expenseRepo.delete(id);
  }
}
export default ExpenseService;
