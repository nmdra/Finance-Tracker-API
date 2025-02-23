import express from 'express'
import {
    authUser,
    deleteUserAccount,
    getUserById,
    logoutUser,
    registerUser,
    updatePassword,
    updateUser,
    validatePassword,
} from '../../controllers/userController.js'
import protect from '../../middleware/authMiddleware.js'

const router = express.Router()

router.route('').post(registerUser).put(protect, updateUser)
router.route('/auth').post(authUser)
router.route('/logout').post(protect, logoutUser)
router.route('/validate-password').post(protect, validatePassword) // Route to validate the current password
router.route('/update-password').put(protect, updatePassword) // Route to update the password
router.route('/').delete(protect, deleteUserAccount)

router.route('/:id').get(protect, getUserById)

export default router