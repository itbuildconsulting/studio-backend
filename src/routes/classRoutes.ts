import express from 'express';
import { createClass, getAllClasses, getClassById, updateClass, deleteClass } from '../controllers/classController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Class
 *   description: Operações com classe
 */

/**
 * @swagger
 * /class:
 *   post:
 *     summary: Criar classe. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: Classe criada com sucesso
 *       401:
 *         description: Erro ao criar classe
 */
router.post('/', authenticateToken, createClass);

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Lista todas as aulas com filtros e paginação
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Data da aula no formato YYYY-MM-DD
 *       - in: query
 *         name: time
 *         schema:
 *           type: string
 *           format: time
 *         required: false
 *         description: Hora da aula no formato HH:MM
 *       - in: query
 *         name: productType
 *         schema:
 *           type: string
 *         required: false
 *         description: Nome do tipo de produto associado à aula
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *         required: false
 *         description: Nome do professor associado à aula
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Número da página para paginação
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Número de registros por página
 *     responses:
 *       200:
 *         description: Lista de aulas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       date:
 *                         type: string
 *                         example: "2025-01-18"
 *                       time:
 *                         type: string
 *                         example: "08:00"
 *                       teacherId:
 *                         type: integer
 *                         example: 3
 *                       teacher:
 *                         type: string
 *                         example: "admin"
 *                       productTypeId:
 *                         type: integer
 *                         example: 1
 *                       productType:
 *                         type: string
 *                         example: "Aula Coletiva"
 *                       limit:
 *                         type: integer
 *                         example: 10
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalRecords:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *       404:
 *         description: Nenhuma aula encontrada
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
 *                   example: "Nenhuma aula encontrada"
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
 *                   example: "Erro interno no servidor"
 */

router.post('/filter', authenticateToken, getAllClasses);

/**
 * @swagger
 * /class/{id}:
 *   get:
 *     summary: Lista classe por ID. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: Classe listada
 *       401:
 *         description: Erro ao listar classe
 */
router.get('/:id', authenticateToken, getClassById);

/**
 * @swagger
 * /class/{id}:
 *   put:
 *     summary: Atualizar classe. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: Classe atualizada
 *       401:
 *         description: Erro ao atualizar classe
 */
router.put('/:id', authenticateToken, updateClass);

/**
 * @swagger
 * /class/{id}:
 *   delete:
 *     summary: Deletar classe. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: Classe deletada
 *       401:
 *         description: Erro ao deletar classe
 */
router.delete('/:id', authenticateToken, deleteClass);

export default router;
