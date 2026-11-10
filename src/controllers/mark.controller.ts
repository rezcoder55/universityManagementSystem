import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Add or update student marks (Teacher or Admin)
export const recordMarks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Inside recordMarks function:
    const { studentId, subjectId, examType, marksObtained, maxMarks, term } =
      req.body;

    // Validate required fields including subjectId
    if (
      !studentId ||
      !subjectId ||
      !examType ||
      marksObtained === undefined ||
      maxMarks === undefined ||
      !term
    ) {
      sendError(
        res,
        400,
        "studentId, subjectId, examType, marksObtained, maxMarks, and term are required"
      );
      return;
    }

    // Verify subject exists
    const subjectExists = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subjectExists) {
      sendError(res, 404, "Subject not found");
      return;
    }

    // Create mark record
    const mark = await prisma.mark.create({
      data: {
        studentId,
        subjectId,
        examType,
        marksObtained: Number(marksObtained),
        maxMarks: Number(maxMarks),
        term,
      },
      include: {
        subject: true,
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    sendSuccess(res, 201, "Mark recorded successfully", mark);
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Get marks for a specific student (Accessible by Admin, Teacher, Student themselves, or their Parent)
export const getStudentMarks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (!studentId || typeof studentId !== "string") {
      sendError(res, 400, "studentId parameter is required");
      return;
    }

    const marks = await prisma.mark.findMany({
      where: { studentId },
      include: {
        subject: true,
      },
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, 200, "Marks retrieved successfully", {
      count: marks.length,
      marks,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};
