import { Router } from 'express';
import { getTrips, getTripById, createTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip } from '../controllers/trip.controller';
import { validate } from '../middlewares/validate';
import { scheduleTripSchema, completeTripSchema } from '../validators/trip.validator';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getTrips);
router.get('/:id', authenticate, getTripById);

// Operations are secured under roles checks
router.post('/', authenticate, authorize(['ADMIN', 'DISPATCHER']), validate(scheduleTripSchema), createTrip);
router.post('/:id/dispatch', authenticate, authorize(['ADMIN', 'DISPATCHER']), dispatchTrip);
router.post('/:id/complete', authenticate, authorize(['ADMIN', 'DISPATCHER', 'DRIVER']), validate(completeTripSchema), completeTrip);
router.post('/:id/cancel', authenticate, authorize(['ADMIN', 'DISPATCHER']), cancelTrip);

router.delete('/:id', authenticate, authorize(['ADMIN', 'DISPATCHER']), deleteTrip);

export default router;
