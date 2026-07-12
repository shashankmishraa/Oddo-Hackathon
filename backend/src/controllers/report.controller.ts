import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { sendSuccess } from '../utils/response';

const reportService = new ReportService();

export const getReportSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportData = await reportService.getFleetReport();
    return sendSuccess(res, reportData, 'Fleet report summary generated successfully');
  } catch (error) {
    return next(error);
  }
};

export const exportReportCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportData = await reportService.getFleetReport();
    const csvContent = await reportService.generateCSV(reportData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transitops_fleet_report.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    return next(error);
  }
};
