import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getNotes, upsertNotes } from '../controllers/notesController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getNotes);
router.post('/', upsertNotes);

export default router;
