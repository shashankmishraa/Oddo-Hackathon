import { Request, Response, NextFunction } from 'express';
import { TripService } from '../services/trip.service';
import { sendSuccess } from '../utils/response';
import { TripStatus } from '../constants/enums';

import { parseQueryParams } from '../utils/queryHelper';

const tripService = new TripService();

export const getTrips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedOptions = parseQueryParams(req);
    const result = await tripService.getAllTrips({
      search: parsedOptions.search,
      status: parsedOptions.filters.status,
      vehicleId: parsedOptions.filters.vehicleId,
      driverId: parsedOptions.filters.driverId,
      dateRange: parsedOptions.filters.dateRange,
      sortBy: parsedOptions.sortBy,
      sortOrder: parsedOptions.sortOrder,
      skip: parsedOptions.skip,
      take: parsedOptions.take,
      page: parsedOptions.page,
      limit: parsedOptions.limit,
    });
    return sendSuccess(res, result, 'Trips retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const getTripById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const trip = await tripService.getTripDetails(id);
    return sendSuccess(res, trip, 'Trip details retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const createTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await tripService.scheduleTrip(req.body);
    return sendSuccess(res, trip, 'Trip scheduled successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const dispatchTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const trip = await tripService.dispatchTrip(id);
    return sendSuccess(res, trip, 'Trip dispatched successfully');
  } catch (error) {
    return next(error);
  }
};

export const completeTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const trip = await tripService.completeTrip(id, req.body);
    return sendSuccess(res, trip, 'Trip completed successfully');
  } catch (error) {
    return next(error);
  }
};

export const cancelTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const trip = await tripService.cancelTrip(id);
    return sendSuccess(res, trip, 'Trip cancelled successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await tripService.removeTrip(id);
    return sendSuccess(res, null, 'Trip deleted successfully');
  } catch (error) {
    return next(error);
  }
};
