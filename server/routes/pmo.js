import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getRelapses, logRelapse, getPMOStats, deleteRelapse } from '../controllers/pmoController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/pmo:
 *   get:
 *     tags: [PMO]
 *     summary: List relapse entries
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
 *         description: Array of relapse logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PMOLog'
 */
router.get('/', getRelapses);

/**
 * @openapi
 * /api/pmo/stats:
 *   get:
 *     tags: [PMO]
 *     summary: Get PMO streak and relapse statistics
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Streak and count data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentStreak: { type: integer }
 *                 longestStreak: { type: integer }
 *                 totalThisMonth: { type: integer }
 *                 totalThisYear: { type: integer }
 *                 totalAllTime: { type: integer }
 *                 lastRelapse: { type: string, format: date-time, nullable: true }
 */
router.get('/stats', getPMOStats);

/**
 * @openapi
 * /api/pmo:
 *   post:
 *     tags: [PMO]
 *     summary: Log a new relapse
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Created relapse entry
 */
router.post('/', logRelapse);

/**
 * @openapi
 * /api/pmo/{id}:
 *   delete:
 *     tags: [PMO]
 *     summary: Delete a relapse entry
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
router.delete('/:id', deleteRelapse);

export default router;
