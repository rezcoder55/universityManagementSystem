import type { Response } from "express";
import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import type { AttendanceStatus } from "@prisma/client";

// Mark or record attendance for students in a class (Teacher or Admin)
export const markAttendance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { classId, date, records, teacherId: bodyTeacherId } = req.body;
    // records format: [{ studentId: "uuid", status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" }]

    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // 1. Determine teacherId
    let markedByTeacherId: string | undefined = bodyTeacherId;

    if (userRole === "TEACHER") {
      if (!userId) {
        sendError(res, 401, "User not authenticated");
        return;
      }

      const teacher = await prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher) {
        sendError(res, 404, "Teacher profile not found for this user");
        return;
      }

      markedByTeacherId = teacher.id;
    }

    if (!markedByTeacherId) {
      sendError(res, 400, "teacherId is required to record attendance");
      return;
    }

    // Assign to a const to preserve narrowing across closures
    const teacherId = markedByTeacherId;

    // 2. Validate input
    if (!classId || typeof classId !== "string") {
      sendError(res, 400, "classId is required");
      return;
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      sendError(res, 400, "Attendance records must be a non-empty array");
      return;
    }

    const attendanceDate = date ? new Date(date) : new Date();

    // 3. Process attendance entries using upsert with the compound unique key (studentId_date)
    const attendancePromises = records.map(
      (record: { studentId: string; status?: AttendanceStatus }) => {
        return prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: record.studentId,
              date: attendanceDate,
            },
          },
          update: {
            status: record.status || "PRESENT",
            teacherId,
            classId,
          },
          create: {
            studentId: record.studentId,
            classId,
            teacherId,
            date: attendanceDate,
            status: record.status || "PRESENT",
          },
        });
      }
    );

    const savedRecords = await Promise.all(attendancePromises);

    sendSuccess(res, 201, "Attendance recorded successfully", {
      count: savedRecords.length,
      records: savedRecords,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Get attendance records by class and date
export const getAttendanceByClass = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    if (!classId || typeof classId !== "string") {
      sendError(res, 400, "classId parameter is required");
      return;
    }

    const filter: {
      classId: string;
      date?: {
        gte: Date;
        lte: Date;
      };
    } = { classId };

    if (date && typeof date === "string") {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      filter.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: filter,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    sendSuccess(res, 200, "Attendance records retrieved successfully", {
      count: attendanceRecords.length,
      attendance: attendanceRecords,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};
