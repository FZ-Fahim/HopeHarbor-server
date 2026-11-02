import { Router } from 'express';
import {
  getRecentEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  getMyEvents,
  updateEvent,
  deleteEvent,
} from '../controllers/event.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/recent', getRecentEvents);
router.get('/upcoming', getUpcomingEvents);

// Protected routes (Notice: /user/my-events is placed before /:id)
router.get('/user/my-events', requireAuth as any, getMyEvents);
router.post('/', requireAuth as any, createEvent);
router.put('/:id', requireAuth as any, updateEvent);
router.delete('/:id', requireAuth as any, deleteEvent);

// Public single event detail
router.get('/:id', getEventById);

export default router;