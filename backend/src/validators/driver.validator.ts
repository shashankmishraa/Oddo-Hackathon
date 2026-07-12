import { z } from 'zod';

const dateValidator = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format (must be parseable date string)',
});

export const createDriverSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    licenseNumber: z.string().min(2, 'License number is required'),
    licenseExpiry: dateValidator,
    safetyScore: z.number().min(0.0).max(5.0).optional(),
    status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
  }),
});

export const updateDriverSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    licenseNumber: z.string().min(2).optional(),
    licenseExpiry: dateValidator.optional(),
    safetyScore: z.number().min(0.0).max(5.0).optional(),
    status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
  }),
});
