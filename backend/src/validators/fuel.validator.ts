import { z } from 'zod';

const dateValidator = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format (must be parseable date string)',
});

export const createFuelLogSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid('Invalid vehicle ID format'),
    driverId: z.string().uuid('Invalid driver ID format'),
    liters: z.number().positive('Liters must be a positive number'),
    cost: z.number().nonnegative('Cost must be positive or zero'),
    date: dateValidator,
    odometerReading: z.number().positive('Odometer reading must be positive'),
  }),
});

export const updateFuelLogSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid().optional(),
    driverId: z.string().uuid().optional(),
    liters: z.number().positive().optional(),
    cost: z.number().nonnegative().optional(),
    date: dateValidator.optional(),
    odometerReading: z.number().positive().optional(),
  }),
});
