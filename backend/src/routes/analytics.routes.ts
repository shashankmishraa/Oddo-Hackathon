import { Router } from 'express';
import { getFleetOperationalCostsReport, getVehicleCostSummaryReport } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/fleet-costs', authenticate, getFleetOperationalCostsReport);
router.get('/vehicle-costs/:id', authenticate, getVehicleCostSummaryReport);

export default router;
