import { Router } from 'express';
import { createManualJob, getUserJobs, getJobById, deleteJob, updateJobStatus, getJobStats} from '../controllers/jobController.js';

const router = Router();

router.post('/', createManualJob);
router.get('/:userId', getUserJobs);

router.get('/detail/:id', getJobById); // נתיב חדש לפרטים
router.delete('/:id', deleteJob);      // נתיב חדש למחיקה

router.patch('/:id/status', updateJobStatus);

router.get('/stats/:userId', getJobStats);

export default router;