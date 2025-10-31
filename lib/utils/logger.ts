/**
 * Structured logging utility for authentication and application logging
 * 
 * Provides structured logging with different log levels and context information.
 * Supports both development (console) and production (structured JSON) formats.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    status?: number;
    [key: string]: unknown;
  };
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatError(error: unknown): LogEntry['error'] {
    if (!error) return undefined;

    if (error instanceof Error) {
      const errorObj: LogEntry['error'] = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      };

      // Extract Supabase error properties
      if ('code' in error) {
        errorObj.code = String(error.code);
      }
      if ('status' in error) {
        errorObj.status = Number(error.status);
      }
      if ('statusCode' in error) {
        errorObj.status = Number(error.statusCode);
      }

      // Include any additional properties
      Object.keys(error).forEach(key => {
        if (!['name', 'message', 'stack', 'code', 'status', 'statusCode'].includes(key)) {
          errorObj[key] = (error as Record<string, unknown>)[key];
        }
      });

      return errorObj;
    }

    if (typeof error === 'object') {
      return {
        name: 'UnknownError',
        message: JSON.stringify(error),
        ...(error as Record<string, unknown>)
      };
    }

    return {
      name: 'UnknownError',
      message: String(error)
    };
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized: LogContext = {};
    const sensitiveKeys = ['password', 'token', 'token_hash', 'code', 'secret', 'key'];

    Object.keys(context).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = context[key];
      }
    });

    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      error: error ? this.formatError(error) : undefined
    };

    if (this.isDevelopment) {
      // Development: Pretty console output
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
      const prefix = `[${logEntry.timestamp}] [${level.toUpperCase()}]`;

      if (error) {
        console[consoleMethod](prefix, message, {
          ...logEntry.context,
          error: logEntry.error
        });
        if (error instanceof Error && error.stack) {
          console[consoleMethod](error.stack);
        }
      } else {
        console[consoleMethod](prefix, message, logEntry.context);
      }
    } else {
      // Production: Structured JSON output
      const jsonOutput = JSON.stringify(logEntry);
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](jsonOutput);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: unknown): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: unknown): void {
    this.log('error', message, context, error);
  }
}

// Export singleton instance
export const logger = new Logger();

