import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import type { FeeStatus } from "@prisma/client";

// Function to generate unique fee voucher number automatically
const generateVoucherNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await prisma.feeVoucher.count();
  const sequence = (count + 1).toString().padStart(5, "0"); // e.g., 00001, 00002
  return `VOUCH-${currentYear}-${sequence}`;
};

// Generate a fee voucher for a student (Admin only)
export const createFeeVoucher = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { studentId, amount, dueDate, title, description, voucherNumber } =
      req.body;

    // Validate required fields
    if (!studentId || !amount || !dueDate || !title) {
      sendError(
        res,
        400,
        "studentId, amount, dueDate, and title are required fields"
      );
      return;
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      sendError(res, 404, "Student not found");
      return;
    }

    // Generate or use provided voucher number
    const finalVoucherNumber =
      voucherNumber || (await generateVoucherNumber());

    // Create the fee voucher
    const feeVoucher = await prisma.feeVoucher.create({
      data: {
        voucherNumber: finalVoucherNumber,
        studentId,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        title,
        description: description || null,
        status: "PENDING",
      },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    sendSuccess(res, 201, "Fee voucher created successfully", feeVoucher);
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Update fee voucher status to PAID / CANCELLED / PENDING / OVERDUE (Admin only)
export const updateFeeVoucherStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paidAt, paymentDate } = req.body;

    if (!id || typeof id !== "string") {
      sendError(res, 400, "Voucher id parameter is required");
      return;
    }

    const validStatuses: FeeStatus[] = [
      "PENDING",
      "PAID",
      "CANCELLED",
      "OVERDUE",
    ];

    if (!status || !validStatuses.includes(status as FeeStatus)) {
      sendError(
        res,
        400,
        "Valid status is required (PENDING, PAID, OVERDUE, CANCELLED)"
      );
      return;
    }

    const paymentDateTime = paidAt || paymentDate;

    const updatedVoucher = await prisma.feeVoucher.update({
      where: { id },
      data: {
        status: status as FeeStatus,
        paymentDate:
          status === "PAID"
            ? paymentDateTime
              ? new Date(paymentDateTime)
              : new Date()
            : null,
      },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    sendSuccess(
      res,
      200,
      "Fee voucher status updated successfully",
      updatedVoucher
    );
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Get fee vouchers by student ID (Admin, Parent, or Student)
export const getStudentFeeVouchers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (!studentId || typeof studentId !== "string") {
      sendError(res, 400, "studentId parameter is required");
      return;
    }

    const vouchers = await prisma.feeVoucher.findMany({
      where: { studentId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, 200, "Fee vouchers retrieved successfully", {
      count: vouchers.length,
      vouchers,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};
