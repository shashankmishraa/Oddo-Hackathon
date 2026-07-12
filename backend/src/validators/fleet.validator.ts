import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z.string().min(2, 'Registration plate is required'),
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.number().int().min(1900, 'Invalid year').max(new Date().getFullYear() + 2, 'Invalid year'),
    status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
  }),
});

export const updateVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z.string().min(2).optional(),
    make: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
    status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
  }),
});
