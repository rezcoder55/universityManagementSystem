import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiResponse.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export interface UserPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
}

// Extend Express Request interface to include decoded JWT user payload
export interface AuthRequest extends Request {
  user?: UserPayload;
}

// 1. Middleware to verify JWT token authentication
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, 401, "Access denied. No token provided.");
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    sendError(res, 401, "Access denied. Token is missing.");
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    sendError(res, 403, "Invalid or expired token.");
  }
};

// 2. Middleware to authorize roles
export const restrictTo = (
  ...allowedRoles: ("ADMIN" | "TEACHER" | "STUDENT" | "PARENT")[]
) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    console.log(allowedRoles);
    console.log(req.user?.role);

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      sendError(res, 403, "You do not have permission to perform this action.");
      return;
    }
    next();
  };
};
