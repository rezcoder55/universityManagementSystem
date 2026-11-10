import { Router } from "express";
import {
  createTeacher,
  getAllTeachers,
  assignTeacherToClasses,
} from "../controllers/teacher.controller.js";
import { verifyToken, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all teachers (Admin and Teachers can view)
router.get("/", verifyToken, restrictTo("ADMIN", "TEACHER"), getAllTeachers);

// Create a new teacher (Admin only)
router.post("/", verifyToken, restrictTo("ADMIN"), createTeacher);

// Assign classes to a teacher (Admin only)
router.post(
  "/:teacherId/assign-classes",
  verifyToken,
  restrictTo("ADMIN"),
  assignTeacherToClasses
);

export default router;
