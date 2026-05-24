import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { errorHandler } from './shared/middleware/error.middleware.js';
import { AppError } from './shared/errors/AppError.js';
import { router } from './routes.js';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Body parser, reading data from body into req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Development logging
if (process.env['NODE_ENV'] !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1', router);

// Unknown routes handler
app.use((req, _res, next) => {
  next(new AppError(`Can't find ${req.method} ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(errorHandler);

export { app };
