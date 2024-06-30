const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController')


/**
 * @swagger
 * tags:
 *   name: Persons
 *   description: Operações com pessoas
 */



/**
 * @swagger
 *  /persons:
 *   post:
 *     summary: Criar pessoa(Aluno/Professor). Only Authenticated
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: pessoa(Aluno/Professor) Criado
 *         content:
 *           application/json:
 *            schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               identity:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                  type: string
 *               birthday:
 *                   type: date
 *                   pattern: /([0-9]{4})-(?:[0-9]{2})-([0-9]{2})/
 *                   example: "2019-05-17"
 *               active:
 *                 type: boolean
 *               height:
 *                 type: integer
 *               weight:
 *                 type: integer
 *               other:
 *                 type: string
 *               password:
 *                 type: string
 *               rule:
 *                 type: string
 *               frequency:
 *                 type: string
 *               employee:
 *                 type: boolean
 *               employee_level:
 *                 type: string
 *       401:
 *         description: Erro ao Criar Produto
 */
router.post('/', personController.create);

/**
 * @swagger
 * /persons:
 *   get:
 *     summary: Retorna a lista de pessoas
 *     tags: [Persons]
 *     responses:
 *       200:
 *         description: Lista de pessoas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 */
router.get('/', personController.getAll);
router.get('/:id', personController.getById);
router.put('/:id', personController.update);
router.delete('/:id', personController.delete);
module.exports = router;