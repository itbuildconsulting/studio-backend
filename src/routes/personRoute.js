const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController')


/**
 * @swagger
 * tags:
 *   name: Person
 *   description: Operações com pessoas. Only Authenticated
 */

/**
 * @swagger
 * /person:
 *   post:
 *     summary: Criar usuário. Only Authenticated
 *     tags: [Person]
 *     responses:
 *       200:
 *         description: Usuário criado
 *       401:
 *         description: Erro ao criar usuário
 */
router.post('/', personController.create);

/**
 * @swagger
 * /person:
 *   get:
 *     summary: lista todos os usuários. Only Authenticated
 *     tags: [Person]
 *     responses:
 *       200:
 *         description: Usuário criado
 *       401:
 *         description: Erro ao criar usuário
 */
router.get('/', personController.getAll);

/**
 * @swagger
 * /person/{id}:
 *   get:
 *     summary: Busca o usuário por Id. Only Authenticated
 *     tags: [Person]
 *     responses:
 *       200:
 *         description: Usuário criado
 *       401:
 *         description: Erro ao criar usuário
 */
router.get('/:id', personController.getById);

/**
 * @swagger
 * /person/{id}:
 *   put:
 *     summary: atualiza o usuário por Id. Only Authenticated
 *     tags: [Person]
 *     responses:
 *       200:
 *         description: Usuário criado
 *       401:
 *         description: Erro ao criar usuário
 */
router.put('/:id', personController.update);

/**
 * @swagger
 * /person/{id}:
 *   delete:
 *     summary: deleta o usuário por Id. Only Authenticated
 *     tags: [Person]
 *     responses:
 *       200:
 *         description: Usuário deletado
 *       401:
 *         description: Erro ao deletar usuário
 */
router.delete('/:id', personController.delete);

module.exports = router;