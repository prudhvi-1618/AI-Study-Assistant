import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { uploadMiddleware, validate, listDocumentsSchema, documentIdSchema, uploadBodySchema } from './upload.validator.js';
import { UploadController } from './upload.controller.js';

const router = Router();
const controller = new UploadController();

// All upload routes require authentication
router.use(authenticate as any);

// POST /api/upload
// multer middleware runs first, then body validation
router.post(
  '/',
  uploadMiddleware,
  validate(uploadBodySchema, 'body'),
  controller.upload
);

// GET /api/upload/documents
router.get(
  '/documents',
  validate(listDocumentsSchema, 'query'),
  controller.listDocuments
);

// GET /api/upload/documents/:documentId
router.get(
  '/documents/:documentId',
  validate(documentIdSchema, 'params'),
  controller.getDocument
);

// DELETE /api/upload/documents/:documentId
router.delete(
  '/documents/:documentId',
  validate(documentIdSchema, 'params'),
  controller.deleteDocument
);

// GET /api/upload/documents/:documentId/status
router.get(
  '/documents/:documentId/status',
  validate(documentIdSchema, 'params'),
  controller.getStatus
);

export default router;
