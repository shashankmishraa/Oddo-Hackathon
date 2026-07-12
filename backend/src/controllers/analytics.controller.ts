import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';

const analyticsService = new AnalyticsService();

export const getFleetOperationalCostsReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await analyticsService.getVehicleOperationalCosts();
    return sendSuccess(res, report, 'Fleet operational cost report generated successfully');
  } catch (error) {
    return next(error);
  }
};

export const getVehicleCostSummaryReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const summary = await analyticsService.getVehicleCostSummary(id);
    if (!summary) {
      throw new AppError('Vehicle not found', 404);
    }
    return sendSuccess(res, summary, 'Vehicle cost summary generated successfully');
  } catch (error) {
    return next(error);
  }
};
