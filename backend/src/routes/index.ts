import { Router } from 'express';
import authRoutes from './auth.routes';
import fleetRoutes from './fleet.routes';
import driverRoutes from './driver.routes';
import routeRoutes from './route.routes';
import tripRoutes from './trip.routes';
import incidentRoutes from './incident.routes';
import maintenanceRoutes from './maintenance.routes';
import fuelRoutes from './fuel.routes';
import expenseRoutes from './expense.routes';
import analyticsRoutes from './analytics.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', fleetRoutes);
router.use('/drivers', driverRoutes);
router.use('/routes', routeRoutes);
router.use('/trips', tripRoutes);
router.use('/incidents', incidentRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/fuel', fuelRoutes);
router.use('/expenses', expenseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

export default router;
