import type { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AppError } from '../../shared/errors/AppError.js';

const uploadService = new UploadService();

export class UploadController {
  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('No files provided', 400);
      }

      const userId = (req as any).user.userId;
      const roomId = req.body.roomId;

      const uploadPromises = files.map(file =>
        uploadService.uploadDocument(
          file.buffer,
          file.originalname,
          file.mimetype,
          userId,
          roomId
        )
      );

      const results = await Promise.all(uploadPromises);

      sendResponse.success(res, 202, 'Files queued for processing', { uploads: results });
    } catch (error) {
      next(error);
    }
  };

  listDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const result = await uploadService.listDocuments(userId, req.query as any);
      sendResponse.success(res, 200, 'Documents retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const doc = await uploadService.getDocument(req.params['documentId'] as string, userId);
      sendResponse.success(res, 200, 'Document retrieved successfully', doc);
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      await uploadService.deleteDocument(req.params['documentId'] as string, userId);
      sendResponse.success(res, 200, 'Document deleted', undefined);
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await uploadService.getJobStatus(req.params['documentId'] as string);
      sendResponse.success(res, 200, 'Ingestion job status retrieved successfully', status);
    } catch (error) {
      next(error);
    }
  };
}
