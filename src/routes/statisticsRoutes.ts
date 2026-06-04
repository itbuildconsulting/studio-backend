import { Router } from 'express';
import {
    getOverviewMetrics,
    getTopStudents,
    getInactiveStudents,
    getStudentsAtRisk
} from '../controllers/statisticsControllerOverview';

import {
    getCreditsExpiringSoon,
    getStudentsWithMostCredits,
    getOccupancyByTime,
    getTopTeachers,
    getOccupancyByDayOfWeek,
    getAutomatedInsights,
    getMonthlyComparison,
    getTicketPerClass,
    getPurchasesByWeekday,
    getRepurchaseInterval,
    getBoughtVsUsed,
    getCumulativeRevenue,
    getMostPurchasedProducts,
} from '../controllers/statisticsControllerPerformance';

const router = Router();

// ==================== VISÃO GERAL ====================
router.post('/overview', getOverviewMetrics);

// ==================== ENGAJAMENTO DE ALUNOS ====================
router.post('/top-students', getTopStudents);
router.post('/inactive-students', getInactiveStudents);
router.get('/students-at-risk', getStudentsAtRisk);

// ==================== CRÉDITOS ====================
router.post('/expiring-credits', getCreditsExpiringSoon);
router.post('/most-credits', getStudentsWithMostCredits);

// ==================== PERFORMANCE DE AULAS ====================
router.post('/occupancy-by-time', getOccupancyByTime);
router.post('/top-teachers', getTopTeachers);
router.get('/occupancy-by-day', getOccupancyByDayOfWeek);

// ==================== INSIGHTS ====================
router.get('/insights', getAutomatedInsights);

// ==================== COMPARAÇÃO MENSAL ====================
router.get('/monthly-comparison', getMonthlyComparison);

// ==================== ANÁLISE FINANCEIRA ====================
router.get('/ticket-per-class', getTicketPerClass);
router.get('/purchases-by-weekday', getPurchasesByWeekday);
router.get('/repurchase-interval', getRepurchaseInterval);
router.get('/bought-vs-used', getBoughtVsUsed);
router.get('/cumulative-revenue', getCumulativeRevenue);
router.get('/most-purchased-products', getMostPurchasedProducts);

export default router;