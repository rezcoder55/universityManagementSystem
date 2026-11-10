import { Router } from "express";
import {
  recordMarks,
  getStudentMarks,
} from "../controllers/mark.controller.js";
import { verifyToken, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Record student marks (Admin and Teacher only)
router.post("/", verifyToken, restrictTo("ADMIN", "TEACHER"), recordMarks);

// Get marks by student ID (Admin, Teacher, and authenticated users)
router.get("/student/:studentId", verifyToken, getStudentMarks);

export default router;
