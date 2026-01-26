import { Request, Response } from 'express';
import prisma from '../config/db.js';

export const createManualJob = async (req: Request, res: Response) => {
  try {
    // 1. הוספת השדות החדשים לחילוץ מה-body
    const { companyName, jobTitle, userId, link, jobDescription, notes } = req.body;
    
    const newJob = await prisma.jobApplication.create({
      data: { 
        companyName, 
        jobTitle, 
        userId, 
        status: "נשלח", // שיניתי לעברית כדי שיתאים ל-frontend שלנו
        link,           // שדה חדש
        jobDescription, // שדה חדש
        notes           // שדה חדש
      }
    });
    res.status(201).json(newJob);
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
};

export const getUserJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string; 
    
    const jobs = await prisma.jobApplication.findMany({ 
      where: { userId: userId },
      orderBy: { createdAt: 'desc' } // בונוס: מציג את המשרות החדשות ביותר למעלה
    });
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; 

    const job = await prisma.jobApplication.findUnique({
      where: { id }
    });

    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; 

    await prisma.jobApplication.delete({
      where: { id }
    });

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete job" });
  }
};

export const updateJobStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const updatedJob = await prisma.jobApplication.update({
      where: { id },
      data: { status }
    });
    
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const getJobStats = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    
    // שליפת ספירה מקובצת לפי סטטוס
    const stats = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true }
    });

    // סך הכל משרות
    const totalJobs = await prisma.jobApplication.count({
      where: { userId }
    });

    res.json({ stats, totalJobs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};