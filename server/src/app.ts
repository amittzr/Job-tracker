import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// ייבוא ה-Routes החדשים
import userRoutes from './routes/userRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// רישום ה-Routes במערכת
app.use('/api/users', userRoutes); // כל מה שקשור למשתמשים יתחיל בנתיב הזה
app.use('/api/jobs', jobRoutes);   // כל מה שקשור למשרות יתחיל בנתיב הזה

// נתיב בדיקה הקיים
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

export default app;