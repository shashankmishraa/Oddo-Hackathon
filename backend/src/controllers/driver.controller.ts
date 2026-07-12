import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service';
import { sendSuccess } from '../utils/response';
import { DriverStatus } from '../constants/enums';

const driverService = new DriverService();

export const getDrivers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const drivers = await driverService.listDrivers(status as DriverStatus);
    return sendSuccess(res, drivers, 'Driver roster retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const getDriverById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driver = await driverService.getDriver(id);
    return sendSuccess(res, driver, 'Driver details retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const createDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const driver = await driverService.registerDriver(req.body);
    return sendSuccess(res, driver, 'Driver registered successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const updateDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driver = await driverService.updateDriver(id, req.body);
    return sendSuccess(res, driver, 'Driver details updated successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await driverService.removeDriver(id);
    return sendSuccess(res, null, 'Driver profile deleted successfully');
  } catch (error) {
    return next(error);
  }
};
