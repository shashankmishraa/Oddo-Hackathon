import { z } from 'zod';

const dateValidator = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format (must be parseable date string)',
});

export const scheduleTripSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid('Invalid vehicle ID format'),
    driverId: z.string().uuid('Invalid driver ID format'),
    cargo: z.number().int().positive('Cargo load must be a positive integer'),
    departureTime: dateValidator,
    arrivalTime: dateValidator,
  }),
});

export const completeTripSchema = z.object({
  body: z.object({
    endOdometer: z.number().positive('End odometer reading must be positive'),
    fuelUsed: z.number().positive('Fuel used must be a positive volume').optional(),
  }),
});
