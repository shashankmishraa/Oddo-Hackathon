import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

const dashboardService = new DashboardService();

export const getDashboardSummaryReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    return sendSuccess(res, summary, 'Dashboard metrics report compiled successfully');
  } catch (error) {
    return next(error);
  }
};
