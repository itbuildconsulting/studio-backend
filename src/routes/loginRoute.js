const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController')

/**
 * @swagger
 * tags:
 *   name: Login
 *   description: Operações de autenticação
 */

/**
 * @swagger
 * /login:
 *   get:
 *     summary: Login do Sistema
 *     tags: [Login]
 *     responses:
 *       200:
 *         description: Sistema funcionando
 *       401:
 *         description: Erro do sistema
 */
router.post('/', loginController.login);

module.exports = router;