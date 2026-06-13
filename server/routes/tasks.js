import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getTasks, getTasksRange, upsertTask, updateTask, getTaskStats } from '../controllers/tasksController.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get tasks for a specific date
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Date to fetch tasks for
 *     responses:
 *       200:
 *         description: Array of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyTask'
 */
router.get('/', getTasks);

/**
 * @openapi
 * /api/tasks/range:
 *   get:
 *     tags: [Tasks]
 *     summary: Get tasks within a date range
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
 *         description: Array of tasks
 */
router.get('/range', getTasksRange);

/**
 * @openapi
 * /api/tasks/stats:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task completion statistics
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, year] }
 *     responses:
 *       200:
 *         description: Task stats including streak and completion rate
 */
router.get('/stats', getTaskStats);

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create or update a task
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, task_number, title]
 *             properties:
 *               date: { type: string, format: date }
 *               task_number: { type: integer, minimum: 1, maximum: 3 }
 *               title: { type: string }
 *               priority: { type: string, enum: [High, Medium, Low] }
 *               status: { type: string, enum: [pending, done] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Upserted task
 */
router.post('/', upsertTask);

/**
 * @openapi
 * /api/tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task (e.g. toggle status)
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
 *               status: { type: string, enum: [pending, done] }
 *               title: { type: string }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Updated task
 */
router.put('/:id', updateTask);

export default router;
