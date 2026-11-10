import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  message: string;
  status: "success" | "error";
  data: T;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  status: "success" | "error",
  message: string,
  data: T = null as T
): void => {
  res.status(statusCode).json({
    message,
    status,
    data,
  });
};

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T = null as T
): void => {
  sendResponse(res, statusCode, "success", message, data);
};

export const sendError = <T = unknown>(
  res: Response,
  statusCode: number,
  message: string,
  data: T = null as T
): void => {
  sendResponse(res, statusCode, "error", message, data);
};

