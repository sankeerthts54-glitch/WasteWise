import { Router } from 'express';
import { listDomains, getDomain } from '../controllers/domainsController';

const router = Router();

router.get('/', listDomains);
router.get('/:slug', getDomain);

export default router;
