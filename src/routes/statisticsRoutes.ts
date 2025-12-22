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
    getAutomatedInsights
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

export default router;