import { Router } from 'express';
import { getReportSummary, exportReportCSV } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/summary', authenticate, getReportSummary);
router.get('/export-csv', authenticate, exportReportCSV);

export default router;
