import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { advisoriesController } from '../controllers/advisoriesController';

const router = Router();

// Advisory endpoints — all protected by requireAuth
router.post('/', requireAuth, advisoriesController.create);
router.get('/', requireAuth, advisoriesController.list);
router.get('/:id', requireAuth, advisoriesController.getById);
router.patch('/:id', requireAuth, advisoriesController.update);
router.post('/:id/feedback', requireAuth, advisoriesController.saveFeedback);

export default router;
