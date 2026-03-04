import { Router } from 'express';
import { listInvoices, getInvoice, createInvoice, updateInvoiceStatus } from '../controllers/invoices';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.patch('/:id/status', updateInvoiceStatus);

export default router;
