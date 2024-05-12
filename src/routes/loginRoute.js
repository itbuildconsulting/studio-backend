const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController')

/**
 * @swagger
 * /login/:
 *   post:
 *     description: erererererere
 *     responses:
 *       200:
 *         description: Sucesso
 */
router.post('/', loginController.login);

module.exports = router;