import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import classRoutes from "./routes/class.routes.js";
import studentRoutes from "./routes/student.routes.js";
import { sendSuccess } from "./utils/apiResponse.js";
import teacherRoutes from "./routes/teacher.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import markRoutes from "./routes/mark.routes.js";
import feeVoucherRoutes from "./routes/feeVoucher.routes.js";

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req: Request, res: Response) => {
  sendSuccess(res, 200, "Welcome to the School Management API", {
    healthCheck: "/api/v1/health",
  });
});

// Health check route
app.get("/api/v1/health", (req: Request, res: Response) => {
  sendSuccess(res, 200, "School Management API is running smoothly!", null);
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/marks", markRoutes);
app.use("/api/v1/fee-vouchers", feeVoucherRoutes);

export default app;
