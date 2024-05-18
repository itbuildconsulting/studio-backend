const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController')

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
router.post('/', placeController.create);
router.get('/', placeController.getAll);
router.get('/:id', placeController.getById);
router.put('/:id', placeController.update);
router.delete('/:id', placeController.delete);
module.exports = router;