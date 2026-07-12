import { Router } from 'express';
import { getFuelLogs, getFuelLogById, createFuelLog, updateFuelLog, deleteFuelLog } from '../controllers/fuel.controller';
import { validate } from '../middlewares/validate';
import { createFuelLogSchema, updateFuelLogSchema } from '../validators/fuel.validator';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getFuelLogs);
router.get('/:id', authenticate, getFuelLogById);

// Operations are secured under roles checks
router.post('/', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(createFuelLogSchema), createFuelLog);
router.put('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(updateFuelLogSchema), updateFuelLog);
router.delete('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), deleteFuelLog);

export default router;
