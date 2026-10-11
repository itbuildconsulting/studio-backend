import { Router } from 'express';
import {
  getAllTurmas,
  getTurmaById,
  createTurma,
  updateTurma,
  deleteTurma,
  gerarAulasTurma,
} from '../controllers/turmaController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

router.get('/', authenticateToken, getAllTurmas);
router.get('/:id', authenticateToken, getTurmaById);
router.post('/', authenticateToken, createTurma);
router.put('/:id', authenticateToken, updateTurma);
router.delete('/:id', authenticateToken, deleteTurma);
router.post('/:id/gerar-aulas', authenticateToken, gerarAulasTurma);

export default router;
