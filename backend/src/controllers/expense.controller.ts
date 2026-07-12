import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';
import { sendSuccess } from '../utils/response';

const expenseService = new ExpenseService();

export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expenses = await expenseService.getAllExpenses();
    return sendSuccess(res, expenses, 'Expenses retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const getExpenseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.getExpenseDetails(id);
    return sendSuccess(res, expense, 'Expense details retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.createExpense(req.body);
    return sendSuccess(res, expense, 'Expense registered successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.updateExpense(id, req.body);
    return sendSuccess(res, expense, 'Expense details updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await expenseService.deleteExpense(id);
    return sendSuccess(res, null, 'Expense deleted successfully');
  } catch (error) {
    return next(error);
  }
};
