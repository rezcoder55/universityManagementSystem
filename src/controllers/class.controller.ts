import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Create a new class (Admin only)
export const createClass = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, academicYear } = req.body;

    if (!name || !academicYear) {
      sendError(res, 400, "Class name and academicYear are required");
      return;
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        academicYear,
      },
    });

    sendSuccess(res, 201, "Class created successfully", newClass);
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Get all classes (Accessible to any authenticated user)
export const getAllClasses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    sendSuccess(res, 200, "Classes retrieved successfully", {
      count: classes.length,
      classes,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};
