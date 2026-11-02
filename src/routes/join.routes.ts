import { Router } from 'express';
import {
  joinEvent,
  getMyJoinedEvents,
  getJoinStatus,
} from '../controllers/join.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Notice: /joined/me must be placed before /:id routes
router.get('/joined/me', requireAuth as any, getMyJoinedEvents);
router.get('/:id/join-status', requireAuth as any, getJoinStatus);
router.post('/:id/join', requireAuth as any, joinEvent);

export default router;