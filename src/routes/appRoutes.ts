import { Router } from 'express';
import { addStudentToClassWithBikeNumber, balance, getClassById, getStudentSummary, hours, nextClass, schedule }  from '../controllers/appController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: App
 *   description: Operações da tela do Aplicativo
 */

/**
 * @swagger
 * /B:
 *   post:
 *     summary: Realiza o login do usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */

router.post('/v2/balance', authenticateToken, balance);

/**
 * @swagger
 * /app/v2/schedule:
 *   post:
 *     summary: Realiza o login do usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: number
 *               year:
 *                 type: number
 *     responses:
 */
router.post('/v2/schedule', authenticateToken, schedule);

router.post('/v2/hours', authenticateToken, hours);

router.get('/v2/classes/:id', authenticateToken, getClassById);

/**
 * @swagger
 * /app/v2/classes/enterClass:
 *   post:
 *     summary: Adiciona um aluno a uma aula e atribui uma bike
 *     tags: [Classes]
 *     description: Adiciona um aluno à aula e atribui uma bike disponível.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - studentId
 *               - bikeId
 *             properties:
 *               classId:
 *                 type: integer
 *                 description: O ID da aula em que o aluno será adicionado
 *                 example: 1
 *               studentId:
 *                 type: integer
 *                 description: O ID do aluno que será adicionado à aula
 *                 example: 10
 *               bikeId:
 *                 type: integer
 *                 description: O ID da bike que será atribuída ao aluno
 *                 example: 5
 *     responses:
 *       200:
 *         description: Aluno adicionado à aula com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Aluno adicionado à aula e bike atribuída com sucesso.
 *       400:
 *         description: Erro de validação ou limite de alunos/bikes excedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: O limite de alunos para esta aula foi atingido.
 *       500:
 *         description: Erro interno no servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Erro ao adicionar aluno à aula.
 */

router.post('/v2/classes/enterClass', authenticateToken, addStudentToClassWithBikeNumber);

router.get('/v2/nextClass/:studentId', authenticateToken, nextClass);

router.get('/v2/studentSummary/:studentId', authenticateToken, getStudentSummary);

export default router;
