import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Helper function to auto-generate a subject code (e.g., Mathematics -> MAT-0001)
const generateSubjectCode = async (subjectName: string): Promise<string> => {
  // Extract first 3 letters of the name, uppercase them, or fallback to 'SUB'
  const prefix = subjectName
    ? subjectName.trim().substring(0, 3).toUpperCase()
    : "SUB";

  // Count existing subjects starting with this prefix or total subjects to maintain sequence
  const count = await prisma.subject.count();
  const sequence = (count + 1).toString().padStart(4, "0"); // e.g., 0001, 0002

  return `${prefix}-${sequence}`;
};

// Create a new subject (Admin only)
export const createSubject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      sendError(res, 400, "Subject name is required");
      return;
    }

    // 1. Auto-generate the subject code
    const code = await generateSubjectCode(name);

    // 2. Create the subject in the database
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description: description || null,
      },
    });

    sendSuccess(res, 201, "Subject created successfully", subject);
  } catch (error) {
    sendError(
      res,
      500,
      "Internal server error (Subject might already exist)",
      error
    );
  }
};

// Get all subjects (Admin + Teacher + Student)
export const getAllSubjects = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    sendSuccess(res, 200, "Subjects retrieved successfully", {
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};
