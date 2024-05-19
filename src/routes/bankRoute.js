const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController')

/**
 * @swagger
 * tags:
 *   name: Bank
 *   description: Operações Financeiras
 */

/**
 * @swagger
 * /bank/{personId}:
 *   post:
 *     summary: criar lançamento financeiro. Only Authenticated
 *     tags: [Bank]
 *     responses:
 *       200:
 *         description: lançamento financeiro criado
 *       401:
 *         description: erro ao criar lançamento financeiro
 */
router.post('/', bankController.create);

/**
 * @swagger
 * /bank/{personId}:
 *   get:
 *     summary: lista lançamento financeiro. Only Authenticated
 *     tags: [Bank]
 *     responses:
 *       200:
 *         description: lançamento financeiro listado
 *       401:
 *         description: erro ao listar lançamento financeiro
 */
router.get('/:id', bankController.getById);

module.exports = router;