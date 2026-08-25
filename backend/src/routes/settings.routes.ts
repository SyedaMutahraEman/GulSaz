import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { updateSettingsSchema } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly, adminOrEmployee } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.get('/', authenticate, adminOrEmployee, settingsController.getSettings);
router.put('/', authenticate, adminOnly, validate(updateSettingsSchema), settingsController.updateSettings);

export default router;
