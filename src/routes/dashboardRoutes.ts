import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken';
import { getClassesForNextDays, getMonthlySales, getStudentAttendance } from '../controllers/dashboardController';

const router = Router();

router.post('/frequency', authenticateToken, getStudentAttendance);

router.post('/totalSales', authenticateToken, getMonthlySales);

router.post('/calendarClass', authenticateToken, getClassesForNextDays);


export default router;
