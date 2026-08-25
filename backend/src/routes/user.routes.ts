import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { createUserSchema, updateUserSchema } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);
router.post('/', validate(createUserSchema), userController.createUser);
router.patch('/:id', validate(updateUserSchema), userController.updateUser);

export default router;
