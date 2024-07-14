const express = require('express');
const router = express.Router();
const productTypeController = require('../controllers/productTypeController')

/**
 * @swagger
 * tags:
 *   name: ProductType
 *   description: Operações com Tipo de Produto
 */

/**
 * @swagger
 * /productType:
 *   post:
 *     summary: Criar Tipo de Produto. Only Authenticated
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: Tipo de Produto criado
 *         content:
 *           application/json:
 *            schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               placeId:
 *                 type: string
 *               active:
 *                 type: boolean
 *       401:
 *         description: Erro ao criar Tipo de Produto
 */
router.post('/', productTypeController.create);

/**
 * @swagger
 * /productType:
 *   get:
 *     summary: Lista todos os Tipo de Produto. Only Authenticated
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: Tipo de Produto listado
 *       401:
 *         description: Erro ao listar Tipo de Produto
 */
router.get('/', productTypeController.getAll);

/**
 * @swagger
 * /productType/dropdown/:
 *   get:
 *     summary: Lista todos os Tipo de Produto. Only Authenticated
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: Tipo de Produto + Local listado
 *       401:
 *         description: Erro ao listar Tipo de Produto
 */

router.get('/dropdown/', productTypeController.getDropdown);

/**
 * @swagger
 * /productType/{id}:
 *   get:
 *     summary: Lista Tipo de Produto por id. Only Authenticated
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: Tipo de Produto listado
 *       401:
 *         description: Erro ao listar Tipo de Produto
 */
router.get('/:id', productTypeController.getById);

/**
 * @swagger
 * /productType/{id}:
 *   put:
 *     summary: Atualiza o Tipo de Produto por id. Only Authenticated
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: Tipo de Produto atualizado
 *       401:
 *         description: Erro ao atualizar Tipo de Produto
 */
router.put('/:id', productTypeController.update);

/**
 * @swagger
 * /productType/{id}:
 *   delete:
 *     summary: deleta o Tipo de Produto. Only Authenticated
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: Tipo de Produto deletad0
 *       401:
 *         description: Erro ao deletar Tipo de Produto
 */
router.delete('/:id', productTypeController.delete);

module.exports = router;