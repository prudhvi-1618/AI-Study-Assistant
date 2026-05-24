import type { Response } from 'express';

export const sendResponse = {
  success: <T>(res: Response, statusCode: number, message: string, data?: T) => {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    });
  },
  error: (res: Response, statusCode: number, message: string) => {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  },
};
