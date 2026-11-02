import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/profile', requireAuth as any, getProfile);
router.patch('/profile', requireAuth as any, updateProfile);

export default router;