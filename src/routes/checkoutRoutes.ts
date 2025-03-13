import express, { Router } from 'express';
import { checkout, checkoutCash } from '../controllers/checkoutController';
import { authenticateToken } from '../core/token/authenticateToken'; // Importe o middleware de autenticação

const router: Router = express.Router();

/**
 * Rota para o endpoint de checkout com autenticação
 */
router.post('/', authenticateToken, checkout);

router.post('/dashboard', authenticateToken, checkoutCash);

export default router;
