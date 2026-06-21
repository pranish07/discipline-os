import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getSchedule, saveSchedule, addScheduleItem, updateScheduleItem, deleteScheduleItem, getLogs, upsertLog, updateLog, deleteLog, getExerciseStats } from '../controllers/exerciseController.js';

const router = Router();
router.use(authMiddleware);

router.get('/schedule', getSchedule);
router.post('/schedule', saveSchedule);
router.post('/schedule/item', addScheduleItem);
router.put('/schedule/item/:id', updateScheduleItem);
router.delete('/schedule/item/:id', deleteScheduleItem);

router.get('/logs', getLogs);
router.post('/logs', upsertLog);
router.put('/logs/:id', updateLog);
router.delete('/logs/:id', deleteLog);

router.get('/stats', getExerciseStats);

export default router;
