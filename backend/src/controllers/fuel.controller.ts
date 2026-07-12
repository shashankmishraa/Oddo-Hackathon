import { Request, Response, NextFunction } from 'express';
import { FuelService } from '../services/fuel.service';
import { sendSuccess } from '../utils/response';

const fuelService = new FuelService();

export const getFuelLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await fuelService.getAllLogs();
    return sendSuccess(res, logs, 'Fuel logs retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const getFuelLogById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const log = await fuelService.getLogDetails(id);
    return sendSuccess(res, log, 'Fuel details retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const createFuelLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await fuelService.createLog(req.body);
    return sendSuccess(res, log, 'Fuel log registered successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const updateFuelLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const log = await fuelService.updateLog(id, req.body);
    return sendSuccess(res, log, 'Fuel log details updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteFuelLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await fuelService.deleteLog(id);
    return sendSuccess(res, null, 'Fuel log deleted successfully');
  } catch (error) {
    return next(error);
  }
};
