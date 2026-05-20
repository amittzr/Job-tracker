import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files (CV files) from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Register Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

export default app;