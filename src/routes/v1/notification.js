import express from 'express';
import {
    getNotifications,
    markAsRead,
} from '../../controllers/notificationController.js';
import { protect, regularOnly } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, regularOnly, getNotifications);
router.route('/:id/read').put(protect, regularOnly, markAsRead);

export default router;
