import { Router } from "express";
import {
  createSubject,
  getAllSubjects,
} from "../controllers/subject.controller.js";
import { verifyToken, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyToken, getAllSubjects);
router.post("/", verifyToken, restrictTo("ADMIN"), createSubject);

export default router;
