import { Router } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../utils/response';
import { AssistantService } from '../../services/AssistantService';
import { AppError } from '../../errors';
import { HTTP_STATUS } from '../../constants';

const router = Router();
const assistantService = new AssistantService();

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string(),
      })
    )
    .optional()
    .default([]),
});

router.post('/chat', async (req, res, next) => {
  try {
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
      return next(new AppError(errorMsg, HTTP_STATUS.BAD_REQUEST));
    }

    const { message, history } = parseResult.data;
    const aiMessage = await assistantService.chat(message, history);

    return sendSuccess(res, {
      message: aiMessage,
    });
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
