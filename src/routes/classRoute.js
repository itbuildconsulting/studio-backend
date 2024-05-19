const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController')

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
 *         description: classe Criado
 *       401:
 *         description: Erro ao criar classe
 */
router.post('/', classController.create);

/**
 * @swagger
 * /class/{id}:
 *   get:
 *     summary: lista todas as classes. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: classe listada
 *       401:
 *         description: Erro ao listar classe
 */
router.get('/', classController.getAll);

/**
 * @swagger
 * /class/{id}:
 *   get:
 *     summary: lista classe por id. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: classe listada
 *       401:
 *         description: Erro ao listar classe
 */
router.get('/:id', classController.getById);

/**
 * @swagger
 * /class/{id}:
 *   put:
 *     summary: atualizar classe. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: classe atualizada
 *       401:
 *         description: Erro ao atualizar classe
 */
router.put('/:id', classController.update);

/**
 * @swagger
 * /class/{id}:
 *   delete:
 *     summary: deletar classe. Only Authenticated
 *     tags: [Class]
 *     responses:
 *       200:
 *         description: classe deletada
 *       401:
 *         description: erro ao deletar classe
 */
router.delete('/:id', classController.delete);


module.exports = router;