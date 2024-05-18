const express = require('express');
const router = express.Router();
const controller = require('../controllers/seedController')

/**
 * @swagger
 * tags:
 *   name: Seed
 *   description: Inicia o banco de dados
 */

/**
 * @swagger
 * /seed:
 *   post:
 *     summary: Inicia o banco de dados
 *     tags: [Seed]
 *     responses:
 *       200:
 *         description: Banco de dados criado
 *       401:
 *         description: Erro ao criar banco de dados
 */
router.post('/', controller.post);

//router.get('/', controller.get);

module.exports = router;