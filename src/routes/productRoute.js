const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController')

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Operações com produto
 */

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Criar produto. Only Authenticated
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Produto Criado
 *         content:
 *           application/json:
 *            schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               credit:
 *                 type: number
 *               validateDate:
 *                  type: number
 *               productTypeId:
 *                 type: string
 *               placeId:
 *                 type: string
 *               value:
 *                 type: number
 *               active:
 *                 type: boolean
 *       401:
 *         description: Erro ao Criar Produto
 */
router.post('/', productController.create);

/**
 * @swagger
 * /product:
 *   get:
 *     summary: listar todos os produtos. Only Authenticated
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: listar todos os produtos
 *       401:
 *         description: Erro ao listart produtos
 */
router.get('/', productController.getAll);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: listar produto por id. Only Authenticated
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: produto listado por id
 *       401:
 *         description: Erro ao listar produto
 */
router.get('/:id', productController.getById);

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: atualizar produto por id. Only Authenticated
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: produto atualizado 
 *       401:
 *         description: Erro ao atualizar produto
 */
router.put('/:id', productController.update);

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: deleta produto por id. Only Authenticated
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: produto deleta
 *       401:
 *         description: Erro ao deletar produto
 */
router.delete('/:id', productController.delete);

module.exports = router;