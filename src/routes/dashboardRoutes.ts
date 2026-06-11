import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken';
import { getClassesForNextDays, getMonthlySales, getStudentAttendance, getTodayCancellations, getBirthdays } from '../controllers/dashboardController';

const router = Router();

router.post('/frequency', authenticateToken, getStudentAttendance);

router.post('/totalSales', authenticateToken, getMonthlySales);

router.post('/calendarClass', authenticateToken, getClassesForNextDays);

router.get('/cancellations/today', authenticateToken, getTodayCancellations);

router.get('/birthdays', authenticateToken, getBirthdays);

export default router;
