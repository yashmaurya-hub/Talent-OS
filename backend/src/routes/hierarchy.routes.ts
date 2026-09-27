import { Router } from 'express';
import { getHierarchyTree, createNode, updateNode, deleteNode } from '../controllers/hierarchy.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getHierarchyTree);
router.post('/nodes', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), createNode);
router.put('/nodes/:id', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), updateNode);
router.delete('/nodes/:id', requireRole(['SUPER_ADMIN', 'HEAD']), deleteNode);

export default router;
