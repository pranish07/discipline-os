import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getSleepLogs, getSleepLog, upsertSleepLog, updateSleepLog, deleteSleepLog, getSleepStats } from '../controllers/sleepController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/sleep:
 *   get:
 *     tags: [Sleep]
 *     summary: List sleep logs
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
 *         description: Array of sleep logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SleepLog'
 */
router.get('/', getSleepLogs);

/**
 * @openapi
 * /api/sleep/stats:
 *   get:
 *     tags: [Sleep]
 *     summary: Get sleep statistics
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, year] }
 *         description: Period for stats
 *     responses:
 *       200:
 *         description: Sleep stats with on-time analysis
 */
router.get('/stats', getSleepStats);

/**
 * @openapi
 * /api/sleep/{date}:
 *   get:
 *     tags: [Sleep]
 *     summary: Get sleep log for a specific date
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Single sleep log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SleepLog'
 */
router.get('/:date', getSleepLog);

/**
 * @openapi
 * /api/sleep:
 *   post:
 *     tags: [Sleep]
 *     summary: Create or update a sleep log for a date
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
 *               target_wake: { type: string, nullable: true }
 *               target_sleep: { type: string, nullable: true }
 *               actual_wake: { type: string, nullable: true }
 *               actual_sleep: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Upserted sleep log
 */
router.post('/', upsertSleepLog);
router.put('/:id', updateSleepLog);
router.delete('/:id', deleteSleepLog);

export default router;
