// src/server/utils/errorHandler.ts
/**
 * Format error to ensure consistent error messages
 * @param error The caught error
 * @returns Formatted error message
 */
export const formatError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };