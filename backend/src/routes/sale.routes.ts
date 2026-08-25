import { Router } from 'express';
import * as saleController from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOrEmployee } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createSaleSchema, saleQuerySchema } from '../validators/sale.validator';

const router = Router();

router.use(authenticate, adminOrEmployee);

router.post('/', validate(createSaleSchema), saleController.createSale);
router.get('/', validate(saleQuerySchema, 'query'), saleController.listSales);
router.get('/:id', saleController.getSale);

export default router;
