import { Router } from 'express';
import { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense } from '../controllers/expense.controller';
import { validate } from '../middlewares/validate';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expense.validator';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getExpenses);
router.get('/:id', authenticate, getExpenseById);

// Operations are secured under roles checks
router.post('/', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(createExpenseSchema), createExpense);
router.put('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(updateExpenseSchema), updateExpense);
router.delete('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), deleteExpense);

export default router;
