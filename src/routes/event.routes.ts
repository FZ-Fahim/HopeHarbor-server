import { Router } from 'express';
import {
  getRecentEvents,
  getUpcomingEvents,
  getEventById,
} from '../controllers/event.controller.js';

const router = Router();

// Public routes
router.get('/recent', getRecentEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/:id', getEventById);

export default router;