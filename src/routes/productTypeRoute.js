const express = require('express');
const router = express.Router();
const productTypeController = require('../controllers/productTypeController')

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
router.post('/', productTypeController.create);
router.get('/', productTypeController.getAll);
router.get('/:id', productTypeController.getById);
router.put('/:id', productTypeController.update);
router.delete('/:id', productTypeController.delete);
module.exports = router;