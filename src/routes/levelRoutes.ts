import { Router } from 'express';
import { createLevel, updateLevel, deleteLevel, getAllLevels, recalculateStudentLevels, getLevelsDropdown } from '../controllers/levelController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

// Criar novo nível
router.post('/', authenticateToken, createLevel);

// Atualizar um nível
router.put('/:id', authenticateToken, updateLevel);

// Deletar um nível
router.delete('/:id', authenticateToken, deleteLevel);

// Listar todos os níveis
router.get('/', authenticateToken, getAllLevels);

router.get('/recalculate-levels', authenticateToken, recalculateStudentLevels);

/**
 * @swagger
 * /level/dropdown:
 *   get:
 *     summary: Buscar níveis para dropdown (formato simplificado). Only Authenticated
 *     tags: [Level]
 *     responses:
 *       200:
 *         description: Lista simplificada de níveis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   name:
 *                     type: string
 *                   color:
 *                     type: string
 */
// 🆕 ROTA NOVA: Dropdown de níveis (ANTES da rota /:id)
router.get('/dropdown', authenticateToken, getLevelsDropdown);

export default router;
