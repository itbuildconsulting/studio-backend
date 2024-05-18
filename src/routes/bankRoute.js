const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController')

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
router.post('/', bankController.create);
router.get('/', bankController.getAll);
router.get('/:id', bankController.getById);
router.put('/:id', bankController.update);
router.delete('/:id', bankController.delete);
module.exports = router;