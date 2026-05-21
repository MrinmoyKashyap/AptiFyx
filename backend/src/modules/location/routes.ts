import { Router } from 'express';
import { LocationController } from './controller';
import { validate } from '../../middleware/validate';
import { authenticate, requireMode } from '../../middleware/auth';
import { updateLocationSchema, getNearbySchema, broadcastSchema } from './validators';
import { ActiveMode } from '@aptifyx/shared-types';

const router = Router();
const controller = new LocationController();

router.use(authenticate);

// Partners update their location
router.put('/update', requireMode(ActiveMode.PARTNER), validate(updateLocationSchema), controller.updateLocation);

// Customers can query nearby partners
router.get('/nearby', validate(getNearbySchema), controller.getNearby);

// Broadcast a job (usually triggered internally, but accessible for testing)
router.post('/broadcast', validate(broadcastSchema), controller.broadcast);

export default router;
