import { Router } from "express";
import {
  createStudent,
  getAllStudents,
} from "../controllers/student.controller.js";
import { verifyToken, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all students (Admin and Teacher can view)
router.get("/", verifyToken, restrictTo("ADMIN", "TEACHER"), getAllStudents);

// Create a new student (Admin only)
router.post("/", verifyToken, restrictTo("ADMIN"), createStudent);

export default router;
