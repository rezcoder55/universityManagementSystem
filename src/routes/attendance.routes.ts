import { Router } from "express";
import {
  markAttendance,
  getAttendanceByClass,
} from "../controllers/attendance.controller.js";
import { verifyToken, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Mark attendance (Admin and Teacher only)
router.post("/", verifyToken, restrictTo("ADMIN", "TEACHER"), markAttendance);

// Get attendance for a specific class (Admin and Teacher)
router.get(
  "/class/:classId",
  verifyToken,
  restrictTo("ADMIN", "TEACHER"),
  getAttendanceByClass
);

export default router;
