import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly, adminOrEmployee } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createCategorySchema, updateCategorySchema } from '../validators/product.validator';

const router = Router();

router.use(authenticate);

router.get('/', adminOrEmployee, categoryController.listCategories);
router.get('/:id', adminOrEmployee, categoryController.getCategory);
router.post('/', adminOnly, validate(createCategorySchema), categoryController.createCategory);
router.patch('/:id', adminOnly, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', adminOnly, categoryController.deleteCategory);

export default router;
