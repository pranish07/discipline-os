import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getScreenTimeLog, upsertScreenTimeLog, getScreenTimeStats, deleteScreenTimeLog } from '../controllers/screenTimeController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/screen-time:
 *   get:
 *     tags: [Screen Time]
 *     summary: Get screen time logs
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Filter by date (returns all if omitted)
 *     responses:
 *       200:
 *         description: Screen time log(s)
 */
router.get('/', getScreenTimeLog);

/**
 * @openapi
 * /api/screen-time/stats:
 *   get:
 *     tags: [Screen Time]
 *     summary: Get screen time statistics for a period
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, year] }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Get all logs for a specific year
 *     responses:
 *       200:
 *         description: Array of screen time logs
 */
router.get('/stats', getScreenTimeStats);

/**
 * @openapi
 * /api/screen-time:
 *   post:
 *     tags: [Screen Time]
 *     summary: Create or update a screen time log for a date
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date: { type: string, format: date }
 *               total_minutes: { type: integer }
 *               social_minutes: { type: integer, nullable: true }
 *               entertainment_minutes: { type: integer, nullable: true }
 *               productive_minutes: { type: integer, nullable: true }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Upserted screen time log
 */
router.post('/', upsertScreenTimeLog);

/**
 * @openapi
 * /api/screen-time/{id}:
 *   delete:
 *     tags: [Screen Time]
 *     summary: Delete a screen time log
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
router.delete('/:id', deleteScreenTimeLog);

export default router;
