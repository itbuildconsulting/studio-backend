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
router.post('/', personController.create);
router.get('/', personController.getAll);
router.get('/:id', personController.getById);
router.put('/:id', personController.update);
router.delete('/:id', personController.delete);
module.exports = router;