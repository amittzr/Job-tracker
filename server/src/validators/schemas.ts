import { z } from 'zod';

// ─── User Schemas ─────────────────────────────────────────────────────────────

// POST /api/users/signup
export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  firebaseUid: z.string().optional(),
  displayName: z.string().optional(),
});

// PATCH /api/users/:userId/profile
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  professionalTitle: z.string().optional().default(''),
  contactInfo: z.string().optional().default(''),
  skills: z.union([
    z.array(z.string()),
    z.string(),
  ]).optional(),
});

// ─── Job Schemas ──────────────────────────────────────────────────────────────

// POST /api/jobs (manual create)
export const createJobSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  userId: z.string().min(1, 'User ID is required'),
  link: z.string().url('Invalid URL format').optional().or(z.literal('')),
  jobDescription: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

// POST /api/jobs/auto-add
export const autoAddJobSchema = z.object({
  url: z.string().url('Invalid URL format'),
  userId: z.string().min(1, 'User ID is required'),
});

// PATCH /api/jobs/:id/status
export const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

// POST /api/jobs/:userId/analyze-cv
export const analyzeCVSchema = z.object({
  jobDescriptionUrl: z.string().url().optional(),
  jobDescriptionText: z.string().optional(),
  jobTitle: z.string().optional(),
}).refine(
  (data) => data.jobDescriptionUrl || data.jobDescriptionText,
  { message: 'Either jobDescriptionUrl or jobDescriptionText is required' }
);
