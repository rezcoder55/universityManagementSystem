import type { Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Create a new teacher and optionally assign to classes (Admin only)
export const createTeacher = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password, fullName, phone, specialization, classIds } =
      req.body;

    // Validate required fields
    if (!email || !password || !fullName || !phone || !specialization) {
      sendError(
        res,
        400,
        "Email, password, fullName, phone, and specialization are required"
      );
      return;
    }

    // 1. Check if the user email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      sendError(res, 400, "Email is already in use");
      return;
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Execute transaction to create User, Teacher profile, and TeacherClass relations
    const result = await prisma.$transaction(async (prismaClient) => {
      // Create user with TEACHER role
      const user = await prismaClient.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          fullName,
          phone,
          role: "TEACHER",
        },
      });

      // Create teacher profile
      const teacher = await prismaClient.teacher.create({
        data: {
          userId: user.id,
          specialization,
        },
      });

      // Assign teacher to classes if classIds array is provided
      if (classIds && Array.isArray(classIds) && classIds.length > 0) {
        const teacherClassesData = classIds.map((classId: string) => ({
          teacherId: teacher.id,
          classId,
        }));

        await prismaClient.teacherClass.createMany({
          data: teacherClassesData,
        });
      }

      // Return complete teacher info with relations
      return await prismaClient.teacher.findUnique({
        where: { id: teacher.id },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          classes: {
            include: {
              class: true,
            },
          },
        },
      });
    });

    sendSuccess(res, 201, "Teacher created successfully", result);
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Get all teachers with their assigned classes (Admin & Teachers)
export const getAllTeachers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        classes: {
          include: {
            class: true,
          },
        },
      },
    });

    sendSuccess(res, 200, "Teachers retrieved successfully", {
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Assign a teacher to extra classes (Admin only)
export const assignTeacherToClasses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teacherId } = req.params;
    const { classIds } = req.body; // Array of class IDs
    console.log(teacherId, classIds);

    // Validate that teacherId exists and is a string
    if (!teacherId || typeof teacherId !== "string") {
      sendError(res, 400, "Teacher ID parameter is required");
      return;
    }

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      sendError(res, 400, "classIds must be a non-empty array");
      return;
    }

    const teacherClassesData = classIds.map((classId: string) => ({
      teacherId,
      classId,
    }));

    await prisma.teacherClass.createMany({
      data: teacherClassesData,
      skipDuplicates: true, // Prevents duplicate assignments
    });

    sendSuccess(res, 200, "Classes assigned to teacher successfully");
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};
