// src/routes/parqRoutes.ts
import { Router } from 'express';
import {
  saveParQ,
  getParQ,
  checkParQStatus,
  getStudentsWithoutParQ,
} from '../controllers/parqController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: PAR-Q
 *   description: Questionário de Prontidão para Atividade Física
 */

/**
 * @swagger
 * /parq/{studentId}:
 *   post:
 *     summary: Salvar ou atualizar PAR-Q do aluno
 *     tags: [PAR-Q]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question1
 *               - question2
 *               - question3
 *               - question4
 *               - question5
 *               - question6
 *               - question7
 *             properties:
 *               question1:
 *                 type: boolean
 *               question2:
 *                 type: boolean
 *               question3:
 *                 type: boolean
 *               question4:
 *                 type: boolean
 *               question5:
 *                 type: boolean
 *               question6:
 *                 type: boolean
 *               question7:
 *                 type: boolean
 *               signedTerm:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: PAR-Q salvo com sucesso
 *       400:
 *         description: Termo de responsabilidade não assinado
 *       404:
 *         description: Aluno não encontrado
 */
router.post('/:studentId', authenticateToken, saveParQ);

/**
 * @swagger
 * /parq/{studentId}:
 *   get:
 *     summary: Buscar PAR-Q do aluno
 *     tags: [PAR-Q]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PAR-Q encontrado
 *       404:
 *         description: PAR-Q não encontrado
 */
router.get('/:studentId', authenticateToken, getParQ);

/**
 * @swagger
 * /parq/{studentId}/status:
 *   get:
 *     summary: Verificar se aluno pode agendar aulas
 *     tags: [PAR-Q]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status verificado
 */
router.get('/:studentId/status', authenticateToken, checkParQStatus);

/**
 * @swagger
 * /parq/students/without:
 *   get:
 *     summary: Listar alunos sem PAR-Q preenchido
 *     tags: [PAR-Q]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alunos sem PAR-Q
 */
router.get('/students/without', authenticateToken, getStudentsWithoutParQ);

export default router;