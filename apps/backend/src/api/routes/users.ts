import { Router } from 'express';
import { User } from '../../models/User';
import { z } from 'zod';
import { AppError } from '../../errors';
import { HTTP_STATUS } from '../../constants';
import { sendSuccess } from '../../utils/response';
import { UserService } from '../../services/UserService';
import { EventService } from '../../services/EventService';

const router = Router();
const userService = new UserService();
const eventService = new EventService();

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', HTTP_STATUS.NOT_FOUND));
    }
    return sendSuccess(res, user);
  } catch (error: unknown) {
    next(error);
  }
});

router.get('/:id/settings', async (req, res, next) => {
  try {
    const settings = await userService.getSettings(req.params.id);
    return sendSuccess(res, settings);
  } catch (error: unknown) {
    next(error);
  }
});

router.put('/:id/settings', async (req, res, next) => {
  try {
    const settings = await userService.updateSettings(req.params.id, req.body);
    await eventService.emit('SETTINGS_UPDATED', req.params.id, undefined, undefined, 'info', { updatedFields: Object.keys(req.body) });
    return sendSuccess(res, settings, 'Settings updated successfully');
  } catch (error: unknown) {
    next(error);
  }
});

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
});

// For testing purposes, create a user
router.post('/', async (req, res, next) => {
  try {
    const validatedData = userSchema.parse(req.body);
    const user = new User(validatedData);
    await user.save();
    return sendSuccess(res, user, 'User created successfully', 201);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Validation Error', HTTP_STATUS.BAD_REQUEST));
    }
    next(error);
  }
});

export default router;
