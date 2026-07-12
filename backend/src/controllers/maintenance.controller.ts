import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../services/maintenance.service';
import { sendSuccess } from '../utils/response';

const maintenanceService = new MaintenanceService();

export const getMaintenanceLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await maintenanceService.getAllLogs();
    return sendSuccess(res, logs, 'Maintenance logs retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const getMaintenanceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const log = await maintenanceService.getLogDetails(id);
    return sendSuccess(res, log, 'Maintenance details retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const createMaintenanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await maintenanceService.openMaintenance(req.body);
    return sendSuccess(res, log, 'Maintenance log opened successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const closeMaintenanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const log = await maintenanceService.closeMaintenance(id, req.body);
    return sendSuccess(res, log, 'Maintenance log closed successfully');
  } catch (error) {
    return next(error);
  }
};

export const deleteMaintenanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await maintenanceService.deleteLog(id);
    return sendSuccess(res, null, 'Maintenance log deleted successfully');
  } catch (error) {
    return next(error);
  }
};
