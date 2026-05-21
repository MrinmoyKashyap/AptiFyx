import { Router } from 'express';
import { LedgerController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new LedgerController();

router.use(authenticate);

router.get('/balance', controller.getWallet);
router.get('/transactions', controller.getTransactions);

export default router;
