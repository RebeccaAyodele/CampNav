import type { ErrorCode } from "../constants/error-codes.js";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}
