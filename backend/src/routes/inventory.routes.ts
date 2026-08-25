import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  inventoryAddSchema,
  inventoryAdjustSchema,
  inventoryMovementsQuerySchema,
  inventoryRemoveSchema,
} from '../validators/inventory.validator';

const router = Router();

router.use(authenticate, adminOnly);

router.get(
  '/movements',
  validate(inventoryMovementsQuerySchema, 'query'),
  inventoryController.listMovements
);
router.post('/add', validate(inventoryAddSchema), inventoryController.addStock);
router.post('/remove', validate(inventoryRemoveSchema), inventoryController.removeStock);
router.post('/adjust', validate(inventoryAdjustSchema), inventoryController.adjustStock);

export default router;
