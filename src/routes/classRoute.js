const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController')

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
router.post('/', classController.create);
router.get('/', classController.getAll);
router.get('/:id', classController.getById);
router.put('/:id', classController.update);
router.delete('/:id', classController.delete);
module.exports = router;