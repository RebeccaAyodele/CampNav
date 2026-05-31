/**
 * Centralized logger utility.
 * All logging goes through this module so that in production it can be
 * swapped for a real logging service (Sentry, LogRocket, etc.) without
 * changing any other code.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("User logged in", { userId: "123" });
 *   logger.error("API request failed", new Error("Network timeout"));
 */

import { config } from "@/config";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean = process.env.NODE_ENV === "development";
  private logLevel: LogLevel = config.logging.level;

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog("debug")) return;
    const formatted = this.formatMessage("debug", message, context);
    if (this.isDevelopment) console.debug(formatted);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog("info")) return;
    const formatted = this.formatMessage("info", message, context);
    if (this.isDevelopment) console.info(formatted);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog("warn")) return;
    const formatted = this.formatMessage("warn", message, context);
    console.warn(formatted);
  }

  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (!this.shouldLog("error")) return;

    let errorContext = context;
    let errorMessage = message;

    if (error instanceof Error) {
      errorContext = {
        ...context,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: this.isDevelopment ? error.stack : undefined,
      };
    } else if (error) {
      errorContext = error;
    }

    const formatted = this.formatMessage("error", errorMessage, errorContext);
    console.error(formatted);
  }
}

export const logger = new Logger();
