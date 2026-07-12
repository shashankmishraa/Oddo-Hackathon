import { Router } from 'express';
import { getDrivers, getDriverById, createDriver, updateDriver, deleteDriver } from '../controllers/driver.controller';
import { validate } from '../middlewares/validate';
import { createDriverSchema, updateDriverSchema } from '../validators/driver.validator';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getDrivers);
router.get('/:id', authenticate, getDriverById);

// Modification actions are restricted to Admin and Dispatcher roles
router.post('/', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(createDriverSchema), createDriver);
router.put('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(updateDriverSchema), updateDriver);
router.delete('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), deleteDriver);

export default router;
