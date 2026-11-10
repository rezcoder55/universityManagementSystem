import { type Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Get all students (Accessible by Admin and Teachers)
export const getAllStudents = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        class: true,
        parent: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    sendSuccess(res, 200, "Students retrieved successfully", {
      count: students.length,
      students,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Function to generate unique student code automatically
const generateStudentCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();

  // Count total students in the current year to get the next sequence number
  const count = await prisma.student.count();
  const sequence = (count + 1).toString().padStart(4, "0"); // e.g., 0001, 0002

  return `STU-${currentYear}-${sequence}`;
};

// Create a new student (Accessible by Admin)
export const createStudent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password, fullName, phone, classId, parentId } = req.body;

    // Validate required fields
    if (!email) {
      sendError(res, 400, "Email is required");
      return;
    }

    if (!password) {
      sendError(res, 400, "Password is required");
      return;
    }

    if (!fullName) {
      sendError(res, 400, "Full Name is required");
      return;
    }

    if (!phone) {
      sendError(res, 400, "Phone number is required");
      return;
    }

    // 1. Generate student code automatically
    const studentCode = await generateStudentCode();

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      sendError(res, 400, "Email is already in use");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Transaction to create User and Student profile
    const result = await prisma.$transaction(async (prismaClient) => {
      const user = await prismaClient.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          fullName,
          phone,
          role: "STUDENT",
        },
      });

      const student = await prismaClient.student.create({
        data: {
          userId: user.id,
          classId,
          parentId: parentId || null,
          studentCode,
        },
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          class: true,
        },
      });

      return student;
    });

    sendSuccess(res, 201, "Student created successfully", result);
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};
