import { Router } from 'express';
import { OrderController } from './controller';
import { validate } from '../../middleware/validate';
import { authenticate, requireMode } from '../../middleware/auth';
import { createJobSchema } from './validators';
import { ActiveMode } from '@aptifyx/shared-types';

const router = Router();
const controller = new OrderController();

router.use(authenticate);

// Creation
router.post('/', requireMode(ActiveMode.CUSTOMER), validate(createJobSchema), controller.create);

// Fetching
router.get('/:id', controller.getJob);
router.get('/my/customer', requireMode(ActiveMode.CUSTOMER), controller.getMyCustomerJobs);
router.get('/my/partner', requireMode(ActiveMode.PARTNER), controller.getMyPartnerJobs);

// State transitions (Partner)
router.put('/:id/accept', requireMode(ActiveMode.PARTNER), controller.accept);
router.put('/:id/start', requireMode(ActiveMode.PARTNER), controller.start);
router.put('/:id/complete', requireMode(ActiveMode.PARTNER), controller.complete);

// State transitions (Customer)
router.put('/:id/confirm', requireMode(ActiveMode.CUSTOMER), controller.confirm);

// Shared
router.put('/:id/cancel', controller.cancel);

export default router;
