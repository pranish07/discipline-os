import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getSchedule, saveSchedule, getLogs, upsertLog, updateLog, deleteLog, getExerciseStats } from '../controllers/exerciseController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/exercise/schedule:
 *   get:
 *     tags: [Exercise]
 *     summary: Get weekly exercise schedule
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Array of schedule entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExerciseSchedule'
 */
router.get('/schedule', getSchedule);

/**
 * @openapi
 * /api/exercise/schedule:
 *   post:
 *     tags: [Exercise]
 *     summary: Save weekly exercise schedule (replaces existing)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [schedule]
 *             properties:
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day_of_week: { type: integer, minimum: 0, maximum: 6 }
 *                     exercise_name: { type: string }
 *                     scheduled_time: { type: string }
 *                     is_rest_day: { type: boolean }
 *     responses:
 *       200:
 *         description: Saved schedule
 */
router.post('/schedule', saveSchedule);

/**
 * @openapi
 * /api/exercise/logs:
 *   get:
 *     tags: [Exercise]
 *     summary: Get exercise logs
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Array of exercise logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExerciseLog'
 */
router.get('/logs', getLogs);

/**
 * @openapi
 * /api/exercise/logs:
 *   post:
 *     tags: [Exercise]
 *     summary: Create or update an exercise log
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, schedule_id, status]
 *             properties:
 *               date: { type: string, format: date }
 *               schedule_id: { type: integer }
 *               status: { type: string, enum: [done, skipped] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Upserted log
 */
router.post('/logs', upsertLog);

/**
 * @openapi
 * /api/exercise/logs/{id}:
 *   put:
 *     tags: [Exercise]
 *     summary: Update an exercise log
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [done, skipped] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Updated log
 *   delete:
 *     tags: [Exercise]
 *     summary: Delete an exercise log
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.put('/logs/:id', updateLog);
router.delete('/logs/:id', deleteLog);

/**
 * @openapi
 * /api/exercise/stats:
 *   get:
 *     tags: [Exercise]
 *     summary: Get exercise statistics
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, year] }
 *     responses:
 *       200:
 *         description: Exercise stats with completion rate and streak
 */
router.get('/stats', getExerciseStats);

export default router;
