import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import type { AuthenticatedRequest } from '../../shared/types/common.types.js';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await authService.register(req.body, ipAddress, userAgent);
    sendResponse.success(res, 201, 'User registered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(req.body, ipAddress, userAgent);
    sendResponse.success(res, 200, 'User logged in successfully', result);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken, ipAddress, userAgent);
    sendResponse.success(res, 200, 'Tokens refreshed successfully', result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
    const { refreshToken } = req.body;
    await authService.logout(accessToken || '', refreshToken);
    sendResponse.success(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.userId;
    const user = await authService.getMe(userId);
    sendResponse.success(res, 200, 'User profile retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};
