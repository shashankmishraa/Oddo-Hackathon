import { z } from 'zod';

const dateValidator = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format (must be parseable date string)',
});

export const createExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    date: dateValidator,
    vehicleId: z.string().uuid('Invalid vehicle ID format').nullable().optional(),
    tripId: z.string().uuid('Invalid trip ID format').nullable().optional(),
    driverId: z.string().uuid('Invalid driver ID format').nullable().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
    category: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    date: dateValidator.optional(),
    vehicleId: z.string().uuid().nullable().optional(),
    tripId: z.string().uuid().nullable().optional(),
    driverId: z.string().uuid().nullable().optional(),
  }),
});
