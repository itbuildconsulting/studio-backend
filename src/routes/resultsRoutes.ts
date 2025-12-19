import { Router } from 'express';
import { 
    getFinancialMetrics,
    getRevenueOverTime,
    getPaymentMethodDistribution,
    getTransactionsByStatus
} from '../controllers/resultsController';

const router = Router();

// Novas rotas para métricas
router.post('/metrics', getFinancialMetrics);
router.post('/revenue-over-time', getRevenueOverTime);
router.post('/payment-distribution', getPaymentMethodDistribution);
router.post('/transactions-by-status', getTransactionsByStatus);

export default router;