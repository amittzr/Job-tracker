import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { analyzeJobFromUrl, analyzeCVForJob, scrapeJobFullText } from '../services/aiService.js';

export const createManualJob = async (req: Request, res: Response) => {
  try {
    // Extract job details from request body
    const { companyName, jobTitle, userId, link, jobDescription, notes } = req.body;
    
    const newJob = await prisma.jobApplication.create({
      data: { 
        companyName, 
        jobTitle, 
        userId, 
        status: "pending",
        link,
        jobDescription,
        notes
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
      orderBy: { createdAt: 'desc' }
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

export const updateJobDetails = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { requiredExperience, location } = req.body;
    
    const updatedJob = await prisma.jobApplication.update({
      where: { id },
      data: { requiredExperience, location }
    });
    
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: "Failed to update job details" });
  }
};

export const getJobStats = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    
    // Get count grouped by status
    const stats = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true }
    });

    // Get total job count
    const totalJobs = await prisma.jobApplication.count({
      where: { userId }
    });

    res.json({ stats, totalJobs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const autoCreateJob = async (req: Request, res: Response) => {
  const { url, userId } = req.body;

  // Validate incoming request
  console.log(`DEBUG: Received auto-add request for userId: ${userId}`);

  if (!url || !userId) {
    return res.status(400).json({ error: "URL and userId are required" });
  }

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    // Step 1: Analyze the job posting using AI (with fallback)
    const aiData = await analyzeJobFromUrl(url);

    // Step 2: Get full scraped text for future CV analysis
    let fullDescription: string | null = null;
    try {
      fullDescription = await scrapeJobFullText(url);
    } catch (e) {
      console.warn('[autoCreateJob] Could not get full text (non-blocking)');
    }

    // Step 3: Create database record with AI-extracted data
    const newJob = await prisma.jobApplication.create({
      data: {
        companyName: aiData.companyName,
        jobTitle: aiData.jobTitle,
        jobDescription: aiData.jobDescription,
        jobFullDescription: fullDescription || null,
        requiredExperience: aiData.requiredExperience || null,
        location: aiData.location || null,
        status: aiData.status || "pending",
        link: url,
        userId: userId
      }
    });

    console.log(`Successfully created job: ${newJob.id} for user: ${userId}`);
    return res.status(201).json(newJob);
  } catch (error: any) {
    // Handle Prisma foreign key error (invalid userId)
    if (error.code === 'P2003') {
      console.error("P2003: Invalid userId does not exist in User table");
      return res.status(400).json({ error: "Invalid User ID. Please verify your account." });
    }
    
    // Handle Prisma validation error
    if (error.code === 'P2025') {
      console.error("P2025: Record to update not found");
      return res.status(404).json({ error: "Job record not found" });
    }
    
    console.error("autoCreateJob error:", error.message);
    return res.status(500).json({ error: "Server failed to process job" });
  }
};

/**
 * Analyze CV against Job Description
 * Compare user's CV with a provided job description (URL or text)
 * Uses cached CV structured data and job full description when available
 */
export const analyzeCVForJobDescription = async (req: Request, res: Response) => {
  try {
    const userId = (req.params.userId as string);
    const { jobDescriptionUrl, jobDescriptionText, jobTitle, jobId } = req.body;

    // Validate request
    if (!jobDescriptionUrl && !jobDescriptionText) {
      return res.status(400).json({ 
        error: "Either jobDescriptionUrl or jobDescriptionText is required" 
      });
    }

    // Get user's CV and profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId }
    });

    if (!userProfile || !userProfile.cvParsedText) {
      return res.status(404).json({ 
        error: "User profile or CV not found. Please upload your CV first." 
      });
    }

    // Parse cached CV structured data if available
    let cvStructuredData: any = null;
    if (userProfile.cvStructuredData) {
      try {
        cvStructuredData = JSON.parse(userProfile.cvStructuredData);
        console.log('[Job Controller] Using cached CV structured data');
      } catch (e) {
        console.warn('[Job Controller] Failed to parse cached CV data, will re-extract');
      }
    }

    let jobDescription = jobDescriptionText;
    let resolvedJobTitle = jobTitle;

    // Try to use cached jobFullDescription from DB if jobId provided
    if (jobId) {
      const job = await prisma.jobApplication.findUnique({ where: { id: jobId } });
      if (job?.jobFullDescription) {
        jobDescription = job.jobFullDescription;
        resolvedJobTitle = resolvedJobTitle || job.jobTitle;
        console.log('[Job Controller] Using cached job full description from DB');
      }
    }

    // If URL provided and we don't have a good description yet, scrape it
    if (jobDescriptionUrl && (!jobDescription || jobDescription.length < 200)) {
      try {
        const fullText = await scrapeJobFullText(jobDescriptionUrl);
        if (fullText && fullText.length > (jobDescription?.length || 0)) {
          jobDescription = fullText;
        }
        if (!resolvedJobTitle) {
          const jobData = await analyzeJobFromUrl(jobDescriptionUrl);
          resolvedJobTitle = jobData.jobTitle;
        }
      } catch (scrapeError) {
        console.warn("[Job Controller] URL scraping failed, using provided text:", scrapeError);
      }
    }

    if (!jobDescription) {
      return res.status(400).json({ 
        error: "Could not extract job description from provided URL" 
      });
    }

    // Analyze CV match — pass cached structured data to skip Phase 1
    const analysis = await analyzeCVForJob(
      userProfile.cvParsedText,
      jobDescription,
      resolvedJobTitle || "Unknown Position",
      userProfile.skills || undefined,
      cvStructuredData
    );

    res.status(200).json({
      analysis,
      cvFileName: userProfile.cvFileName,
      analyzedAt: new Date()
    });
  } catch (error) {
    console.error("[Job Controller] CV analysis error:", error);
    res.status(500).json({ 
      error: "Failed to analyze CV against job description" 
    });
  }
};