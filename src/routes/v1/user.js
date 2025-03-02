import express from 'express';
import {
    authUser,
    deleteUserAccount,
    logoutUser,
    registerUser,
    updatePassword,
    updateUser,
    validatePassword,
    getUserProfile,
} from '../../controllers/userController.js';
import { protect, regularOnly } from '../../middleware/authMiddleware.js';

const router = express.Router();

router
    .route('')
    .post(registerUser)
    .put(protect, regularOnly, updateUser)
    .delete(protect, regularOnly, deleteUserAccount);
router.route('/auth').post(authUser);
router.route('/me').post(protect, getUserProfile);
router.route('/logout').post(protect, logoutUser);
router.route('/validate-password').post(protect, validatePassword); // Route to validate the current password
router.route('/update-password').put(protect, updatePassword); // Route to update the password

export default router;
