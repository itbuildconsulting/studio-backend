import express, { Router } from 'express';
import { cancelPaymentAndRefund, checkout, checkoutCash } from '../controllers/checkoutController';
import { authenticateToken } from '../core/token/authenticateToken'; // Importe o middleware de autenticação
import { checkoutPix, checkPixStatus, pixWebhook } from '../controllers/pixController';

const router: Router = express.Router();

/**
 * Rota para o endpoint de checkout com autenticação
 */
router.post('/', authenticateToken, checkout);

router.post('/dashboard', authenticateToken, checkoutCash);

router.post('/cancelPaymentAndRefund', authenticateToken, cancelPaymentAndRefund);

router.post('/pix', authenticateToken, checkoutPix);

router.post('/webhook/pix', authenticateToken, pixWebhook);

router.get('/pix/status/:chargeId', authenticateToken, checkPixStatus);

export default router;
