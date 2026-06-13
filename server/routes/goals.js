import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goalsController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/goals:
 *   get:
 *     tags: [Goals]
 *     summary: List all life goals
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Array of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LifeGoal'
 */
router.get('/', getGoals);

/**
 * @openapi
 * /api/goals:
 *   post:
 *     tags: [Goals]
 *     summary: Create a new life goal
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *     responses:
 *       201:
 *         description: Created goal
 */
router.post('/', createGoal);

/**
 * @openapi
 * /api/goals/{id}:
 *   put:
 *     tags: [Goals]
 *     summary: Update a life goal
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
 *             $ref: '#/components/schemas/LifeGoal'
 *     responses:
 *       200:
 *         description: Updated goal
 */
router.put('/:id', updateGoal);

/**
 * @openapi
 * /api/goals/{id}:
 *   delete:
 *     tags: [Goals]
 *     summary: Delete a life goal
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
router.delete('/:id', deleteGoal);

export default router;
