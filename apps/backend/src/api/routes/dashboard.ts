import { Router } from 'express';
import { sendSuccess } from '../../utils/response';
import { DashboardService } from '../../services/DashboardService';
import { AppError } from '../../errors';
import { HTTP_STATUS } from '../../constants';

const router = Router();
const dashboardService = new DashboardService();

router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.query.userId as string; // in a real app, this comes from auth token
    if (!userId) {
      return next(new AppError('userId query parameter is required', HTTP_STATUS.BAD_REQUEST));
    }
    const dashboardData = await dashboardService.getDashboardData(userId);
    return sendSuccess(res, dashboardData);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
