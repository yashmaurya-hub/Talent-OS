import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  recommendForTask,
} from '../controllers/task.controller';
import { handleNlpQuery } from '../controllers/nlpQuery.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), createTask);
router.post('/:id/recommend', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), recommendForTask);
router.post('/nl-query', handleNlpQuery);

export default router;
