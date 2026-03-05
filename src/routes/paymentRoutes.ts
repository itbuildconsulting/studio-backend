import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken';
import { getInstallmentOptions } from '../controllers/installmentRulesController';
import { calculateInstallmentsFromCart } from '../controllers/paymentController';

const router = Router();

// Buscar opções de parcelamento (público - apenas autenticado)
router.get('/installments', authenticateToken, getInstallmentOptions);

router.post('/calculate-installments', authenticateToken, calculateInstallmentsFromCart);

export default router;