import { Request, Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { sendSuccess } from '../utils/response';
import { VehicleStatus } from '../constants/enums';

import { parseQueryParams } from '../utils/queryHelper';

const vehicleService = new VehicleService();

export const getVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedOptions = parseQueryParams(req);
    const result = await vehicleService.getAllVehicles({
      search: parsedOptions.search,
      status: parsedOptions.filters.status,
      region: parsedOptions.filters.region,
      sortBy: parsedOptions.sortBy,
      sortOrder: parsedOptions.sortOrder,
      skip: parsedOptions.skip,
      take: parsedOptions.take,
      page: parsedOptions.page,
      limit: parsedOptions.limit,
    });
    return sendSuccess(res, result, 'Vehicles retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const getVehicleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const vehicle = await vehicleService.getVehicleDetails(id);
    return sendSuccess(res, vehicle, 'Vehicle details retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const createVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await vehicleService.registerVehicle(req.body);
    return sendSuccess(res, vehicle, 'Vehicle registered successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const vehicle = await vehicleService.updateVehicle(id, req.body);
    return sendSuccess(res, vehicle, 'Vehicle details updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await vehicleService.removeVehicle(id);
    return sendSuccess(res, null, 'Vehicle deleted successfully');
  } catch (error) {
    return next(error);
  }
};
