import { Router } from 'express';
import {
  joinEvent,
  leaveEvent,
  getMyJoinedEvents,
  getJoinStatus,
  getEventVolunteers,
} from '../controllers/join.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Notice: /joined/me must be placed before /:id routes
router.get('/joined/me', requireAuth as any, getMyJoinedEvents);
router.get('/:id/volunteers', getEventVolunteers);
router.get('/:id/join-status', requireAuth as any, getJoinStatus);
router.post('/:id/join', requireAuth as any, joinEvent);
router.delete('/:id/join', requireAuth as any, leaveEvent);

export default router;
