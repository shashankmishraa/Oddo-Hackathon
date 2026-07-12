import { z } from 'zod';

const dateValidator = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format (must be parseable date string)',
});

export const createMaintenanceSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid('Invalid vehicle ID format'),
    description: z.string().min(3, 'Provide a description at least 3 characters long'),
    cost: z.number().nonnegative('Cost must be positive or zero'),
    date: dateValidator,
  }),
});

export const closeMaintenanceSchema = z.object({
  body: z.object({
    cost: z.number().nonnegative('Cost must be positive or zero').optional(),
  }),
});
