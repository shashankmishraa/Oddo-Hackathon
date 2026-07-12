import { Router } from 'express';
import {
  getMaintenanceLogs,
  getMaintenanceById,
  createMaintenanceLog,
  closeMaintenanceLog,
  deleteMaintenanceLog
} from '../controllers/maintenance.controller';
import { validate } from '../middlewares/validate';
import { createMaintenanceSchema, closeMaintenanceSchema } from '../validators/maintenance.validator';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getMaintenanceLogs);
router.get('/:id', authenticate, getMaintenanceById);

// Modification actions are secured under roles check
router.post('/', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(createMaintenanceSchema), createMaintenanceLog);
router.post('/:id/close', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(closeMaintenanceSchema), closeMaintenanceLog);
router.delete('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), deleteMaintenanceLog);

export default router;
