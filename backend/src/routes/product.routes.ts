import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly, adminOrEmployee } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from '../validators/product.validator';

const router = Router();

router.use(authenticate);

router.get('/barcode/:barcode', adminOrEmployee, productController.getProductByBarcode);
router.get('/', adminOrEmployee, validate(productQuerySchema, 'query'), productController.listProducts);
router.get('/:id', adminOrEmployee, productController.getProduct);
router.post('/', adminOnly, validate(createProductSchema), productController.createProduct);
router.patch('/:id', adminOnly, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', adminOnly, productController.deleteProduct);

export default router;
