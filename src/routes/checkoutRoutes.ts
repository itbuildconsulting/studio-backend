import express, { Router } from 'express';
import { checkout } from '../controllers/checkoutController';
import { authenticateToken } from '../core/token/authenticateToken'; // Importe o middleware de autenticação

const router: Router = express.Router();

/**
 * Rota para o endpoint de checkout com autenticação
 */
router.post('/', authenticateToken, checkout);

export default router;
