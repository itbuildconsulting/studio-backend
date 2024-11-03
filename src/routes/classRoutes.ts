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
 * /class:
 *   get:
 *     summary: Lista todas as classes. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: Lista de classes
 *       401:
 *         description: Erro ao listar classes
 */
router.get('/', authenticateToken, getAllClasses);

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
