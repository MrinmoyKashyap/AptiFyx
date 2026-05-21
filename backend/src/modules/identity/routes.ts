import { Router } from 'express';
import { IdentityController } from './controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { registerSchema, loginSchema, switchModeSchema, partnerSetupSchema } from './validators';

const router = Router();
const controller = new IdentityController();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);

// Authenticated routes
router.use(authenticate);
router.get('/me', controller.getMe);
router.post('/switch-mode', validate(switchModeSchema), controller.switchMode);
router.post('/partner-setup', validate(partnerSetupSchema), controller.setupPartner);
router.get('/partner/:id', controller.getPartnerProfile);

export default router;
