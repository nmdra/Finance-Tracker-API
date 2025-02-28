import express from "express";
import {
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress,
    addSavingsToGoal,
} from "../../controllers/goalController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Protected Routes (Require Authentication)
router.route("").post(protect, addGoal);
router.route("/:id").put(protect, updateGoal).delete(protect, deleteGoal);
router.route("/:id/progress").get(protect, getGoalProgress);
router.route("/:id/savings").put(protect, addSavingsToGoal);

export default router;
