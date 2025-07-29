import { Router } from 'express';
import { createPlace, getAllPlaces, getPlaceById, updatePlace, deletePlace } from '../controllers/placeController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Place
 *   description: Operações com locais (filiais)
 */

/**
 * @swagger
 * /place:
 *   post:
 *     summary: Criar um novo local
 *     tags: [Place]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do local
 *               address:
 *                 type: string
 *                 description: Endereço do local
 *               active:
 *                 type: boolean
 *                 description: Se o local está ativo
 *     responses:
 *       201:
 *         description: Local criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     active:
 *                       type: boolean
 *       500:
 *         description: Erro ao criar local
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao criar local"
 */
router.post('/', authenticateToken, createPlace);

/**
 * @swagger
 * /place:
 *   get:
 *     summary: Listar todos os locais
 *     tags: [Place]
 *     responses:
 *       200:
 *         description: Lista de locais
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
 *                   address:
 *                     type: string
 *                   active:
 *                     type: boolean
 *       500:
 *         description: Erro ao listar locais
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao listar locais"
 */
router.get('/', authenticateToken, getAllPlaces);

/**
 * @swagger
 * /place/{id}:
 *   get:
 *     summary: Obter local por ID
 *     tags: [Place]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do local a ser encontrado
 *     responses:
 *       200:
 *         description: Local encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 active:
 *                   type: boolean
 *       404:
 *         description: Local não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Local não encontrado"
 *       500:
 *         description: Erro ao buscar local
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao buscar local"
 */
router.get('/:id', authenticateToken, getPlaceById);

/**
 * @swagger
 * /place/{id}:
 *   put:
 *     summary: Atualizar local por ID
 *     tags: [Place]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do local a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Local atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 active:
 *                   type: boolean
 *       404:
 *         description: Local não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Local não encontrado"
 *       500:
 *         description: Erro ao atualizar local
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao atualizar local"
 */
router.put('/:id', authenticateToken, updatePlace);

/**
 * @swagger
 * /place/{id}:
 *   delete:
 *     summary: Deletar local por ID
 *     tags: [Place]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do local a ser deletado
 *     responses:
 *       200:
 *         description: Local deletado com sucesso
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
 *                   example: "Local excluído com sucesso"
 *       404:
 *         description: Local não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Local não encontrado"
 *       500:
 *         description: Erro ao excluir local
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao excluir local"
 */
router.post('/remove/:id', authenticateToken, deletePlace);

export default router;
