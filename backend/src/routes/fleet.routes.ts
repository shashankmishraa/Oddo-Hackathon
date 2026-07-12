import { Router } from 'express';
import { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } from '../controllers/fleet.controller';
import { getVehicleDocuments, uploadDocument, deleteDocument } from '../controllers/document.controller';
import { validate } from '../middlewares/validate';
import { createVehicleSchema, updateVehicleSchema } from '../validators/fleet.validator';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

router.get('/', authenticate, getVehicles);
router.get('/:id', authenticate, getVehicleById);

// Modification actions are restricted to Admin and Dispatcher roles
router.post('/', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(createVehicleSchema), createVehicle);
router.put('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(updateVehicleSchema), updateVehicle);
router.delete('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), deleteVehicle);

// Vehicle Document Management routes
router.get('/:vehicleId/documents', authenticate, getVehicleDocuments);
router.post('/:vehicleId/documents', authenticate, authorize(['ADMIN', 'DISPATCHER']), upload.single('file'), uploadDocument);
router.delete('/:vehicleId/documents/:docId', authenticate, authorize(['ADMIN', 'DISPATCHER']), deleteDocument);

export default router;

