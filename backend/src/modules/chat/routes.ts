import { Router } from 'express';
import { ChatController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new ChatController();

router.use(authenticate);

router.get('/rooms', controller.getMyRooms);
router.get('/rooms/:roomId/messages', controller.getMessages);
router.post('/rooms/:roomId/messages', controller.sendMessage);

export default router;
