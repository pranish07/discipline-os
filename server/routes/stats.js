import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getOverallStats } from '../controllers/statsController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/stats:
 *   get:
 *     tags: [Stats]
 *     summary: Get overall discipline statistics and score
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [today, yesterday, week, month] }
 *         description: Period for aggregated stats
 *     responses:
 *       200:
 *         description: Overall stats with discipline score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sleep: { type: object }
 *                 tasks: { type: object }
 *                 pmo: { type: object }
 *                 exercise: { type: object }
 *                 disciplineScore: { type: integer }
 */
router.get('/', getOverallStats);

export default router;
