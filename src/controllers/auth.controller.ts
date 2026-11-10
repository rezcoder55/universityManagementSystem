import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Register User (Admin can create accounts, or initial setup)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, role } = req.body;

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      sendError(res, 400, "Email is already in use");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        phone,
        role: role || "STUDENT",
      },
    });

    sendSuccess(res, 201, "User registered successfully", {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};

// Login User
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 400, "Email and password are required");
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendError(res, 401, "Invalid email or password");
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      sendError(res, 401, "Invalid email or password");
      return;
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    sendSuccess(res, 200, "Login successful", {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    sendError(res, 500, "Internal server error", error);
  }
};
