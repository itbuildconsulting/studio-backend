import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken'; // Caminho atualizado para authenticateToken
import { 
  createProductType, 
  getAllProductTypes, 
  getDropdownProductTypes, 
  getProductTypeById, 
  updateProductType, 
  deleteProductType 
} from '../controllers/productTypeController';

const router = Router();

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               placeId:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo de Produto criado
 *       401:
 *         description: Erro ao criar Tipo de Produto
 */
router.post('/', authenticateToken, createProductType);

/**
 * @swagger
 * /productType:
 *   get:
 *     summary: Lista todos os Tipos de Produto. Only Authenticated
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: Tipos de Produto listados
 *       401:
 *         description: Erro ao listar Tipos de Produto
 */
router.get('/', authenticateToken, getAllProductTypes);

/**
 * @swagger
 * /productType/dropdown:
 *   get:
 *     summary: Lista todos os Tipos de Produto + Local. Only Authenticated
 *     tags: [ProductType]
 *     responses:
 *       200:
 *         description: Tipos de Produto + Locais listados
 *       401:
 *         description: Erro ao listar Tipos de Produto
 */
router.get('/dropdown', authenticateToken, getDropdownProductTypes);

/**
 * @swagger
 * /productType/{id}:
 *   get:
 *     summary: Lista Tipo de Produto por id. Only Authenticated
 *     tags: [ProductType]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do Tipo de Produto a ser listado
 *     responses:
 *       200:
 *         description: Tipo de Produto listado
 *       401:
 *         description: Erro ao listar Tipo de Produto
 */
router.get('/:id', authenticateToken, getProductTypeById);

/**
 * @swagger
 * /productType/{id}:
 *   put:
 *     summary: Atualiza o Tipo de Produto por id. Only Authenticated
 *     tags: [ProductType]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do Tipo de Produto a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               placeId:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo de Produto atualizado
 *       401:
 *         description: Erro ao atualizar Tipo de Produto
 */
router.put('/:id', authenticateToken, updateProductType);

/**
 * @swagger
 * /productType/{id}:
 *   delete:
 *     summary: Deleta o Tipo de Produto por id. Only Authenticated
 *     tags: [ProductType]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do Tipo de Produto a ser deletado
 *     responses:
 *       200:
 *         description: Tipo de Produto deletado
 *       401:
 *         description: Erro ao deletar Tipo de Produto
 */
router.post('/remove/:id', authenticateToken, deleteProductType);

export default router;
