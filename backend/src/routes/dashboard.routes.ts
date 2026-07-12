import { Router } from 'express';
import { getDashboardSummaryReport } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getDashboardSummaryReport);

export default router;
