const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController')

/**
 * @swagger
 * tags:
 *   name: Place
 *   description: Operações com local
 */

/**
 * @swagger
 * /place:
 *   post:
 *     summary: Criar local. Only Authenticated
 *     tags: [Place]
 *     responses:
 *       200:
 *         description: Local Criado
 *       401:
 *         description: Erro ao Criar Local
 */
router.post('/', placeController.create);

/**
 * @swagger
 * /place:
 *   get:
 *     summary: Listar local. Only Authenticated
 *     tags: [Place]
 *     responses:
 *       200:
 *         description: Local listado
 *       401:
 *         description: Erro ao listar Local
 */
router.get('/', placeController.getAll);

/**
 * @swagger
 * /place/{id}:
 *   get:
 *     summary: busca local por id. Only Authenticated
 *     tags: [Place]
 *     responses:
 *       200:
 *         description: Local encontrado
 *       401:
 *         description: Erro ao entcontrar Local
 */
router.get('/:id', placeController.getById);

/**
 * @swagger
 * /place/{id}:
 *   put:
 *     summary: Atualizar Local. Only Authenticated
 *     tags: [Place]
 *     responses:
 *       200:
 *         description: Local atualizado
 *       401:
 *         description: Erro ao atualizar Local
 */
router.put('/:id', placeController.update);

/**
 * @swagger
 * /place/{id}:
 *   delete:
 *     summary: deletar local. Only Authenticated
 *     tags: [Place]
 *     responses:
 *       200:
 *         description: Local deletado
 *       401:
 *         description: Erro ao deletar Local
 */
router.delete('/:id', placeController.delete);

module.exports = router;