import { Router } from 'express';
import { submitNps, getNpsReport } from '../controllers/npsController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

// Submeter avaliação (chamado pelo app/CRM — sem auth para facilitar link por email)
router.post('/', submitNps);

// Relatório NPS (admin autenticado)
router.get('/report', authenticateToken, getNpsReport);

export default router;
