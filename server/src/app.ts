import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files (CV files) from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Public route: signup (needs to work before user has a DB record)
app.use('/api/users', userRoutes);

// Protected routes: require valid Firebase token
app.use('/api/jobs', authMiddleware, jobRoutes);

// 404 handler — catches requests to undefined routes
app.use(notFoundHandler);

// Global error handler — catches all unhandled errors (MUST be last)
app.use(globalErrorHandler);

export default app;
