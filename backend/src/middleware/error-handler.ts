import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError";

const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (res.headersSent) {
    return;
  }

  let statusCode = 500;
  let message = "Sunucu tarafında beklenmeyen bir hata oluştu.";

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Gönderilen veriler doğrulanamadı.";
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Geçersiz veri formatı.";
  } else if (
    error instanceof SyntaxError &&
    "body" in error
  ) {
    statusCode = 400;
    message = "Geçersiz JSON formatı.";
  } else if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    statusCode = 409;
    message = "Bu kayıt zaten mevcut.";
  } else if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number" &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
  ) {
    statusCode = error.statusCode;

    if (
      statusCode < 500 &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      message = error.message;
    }
  }

  if (statusCode >= 500) {
    console.error("Server error:", error);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;