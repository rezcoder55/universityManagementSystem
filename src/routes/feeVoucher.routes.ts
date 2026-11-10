import { Router } from "express";
import {
  createFeeVoucher,
  updateFeeVoucherStatus,
  getStudentFeeVouchers,
} from "../controllers/feeVoucher.controller.js";
import { verifyToken, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Create fee voucher (Admin only)
router.post("/", verifyToken, restrictTo("ADMIN"), createFeeVoucher);

// Update status of a fee voucher (Admin only)
router.patch(
  "/:id/status",
  verifyToken,
  restrictTo("ADMIN"),
  updateFeeVoucherStatus
);

// Get student fee vouchers (Authenticated users)
router.get("/student/:studentId", verifyToken, getStudentFeeVouchers);

export default router;
