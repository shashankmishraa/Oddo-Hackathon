import { Router } from 'express';
import { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } from '../controllers/fleet.controller';
import { validate } from '../middlewares/validate';
import { createVehicleSchema, updateVehicleSchema } from '../validators/fleet.validator';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getVehicles);
router.get('/:id', authenticate, getVehicleById);

// Modification actions are restricted to Admin and Dispatcher roles
router.post('/', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(createVehicleSchema), createVehicle);
router.put('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(updateVehicleSchema), updateVehicle);
router.delete('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), deleteVehicle);

export default router;
