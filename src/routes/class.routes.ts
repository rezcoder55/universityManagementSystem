import { Router } from "express";
import { createClass, getAllClasses } from "../controllers/class.controller.js";
import { verifyToken, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all classes (Accessible to any authenticated user)
router.get("/", verifyToken, getAllClasses);

// Create a class (Accessible to ADMIN only)
router.post("/", verifyToken, restrictTo("ADMIN"), createClass);

export default router;
