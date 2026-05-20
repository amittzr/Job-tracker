import { Router } from 'express';
import { createManualJob, getUserJobs, getJobById, deleteJob, updateJobStatus, getJobStats, autoCreateJob, analyzeCVForJobDescription } from '../controllers/jobController.js';

const router = Router();

// AI Agent route - MUST be defined BEFORE parameterized routes to avoid conflicts
router.post('/auto-add', autoCreateJob);

// CV analysis endpoint
router.post('/:userId/analyze-cv', analyzeCVForJobDescription);

// Manual job creation
router.post('/', createManualJob);

// Get all jobs for a user
router.get('/:userId', getUserJobs);

// Get job statistics for a user
router.get('/stats/:userId', getJobStats);

// Get specific job details
router.get('/detail/:id', getJobById);

// Update job status
router.patch('/:id/status', updateJobStatus);

// Delete a job
router.delete('/:id', deleteJob);

export default router;
