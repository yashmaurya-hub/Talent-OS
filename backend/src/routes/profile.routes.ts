import { Router } from 'express';
import {
  getProfiles,
  getProfileById,
  createPerson,
  addPerformanceRecord,
  addSkillRecord,
  addActivity,
  addAchievement,
} from '../controllers/profile.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getProfiles);
router.get('/:id', getProfileById);
router.post('/', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), createPerson);

// Record logging endpoints
router.post('/:id/records', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), addPerformanceRecord);
router.post('/:id/skills', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), addSkillRecord);
router.post('/:id/activities', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), addActivity);
router.post('/:id/achievements', requireRole(['SUPER_ADMIN', 'HEAD', 'MANAGER']), addAchievement);

export default router;
