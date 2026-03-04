import { Router } from 'express';
import { getTenant, updateTenant, getDashboard } from '../controllers/tenants';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', getTenant);
router.put('/', requireRole('admin'), updateTenant);
router.get('/dashboard', getDashboard);

export default router;
