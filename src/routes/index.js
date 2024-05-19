const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Index
 *   description: Dados do sistema
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Info Sistema
 *     tags: [Index]
 *     responses:
 *       200:
 *         description: Sistema funcionando
 *       401:
 *         description: Erro do sistema
 */
router.get('/', function (req, res, next) {
    res.status(200).send({
        title: "Studio Backend",
        version: "1.0.0",
        node: {
            version: "20.13.1"
        }
    });
});

module.exports = router;