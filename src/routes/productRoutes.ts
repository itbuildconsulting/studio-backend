import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken'; // Middleware de autenticação
import { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct, 
    getDropdownProducts 
} from '../controllers/productController';

const router = Router();

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               credit:
 *                 type: number
 *               validateDate:
 *                 type: number
 *               productTypeId:
 *                 type: string
 *               placeId:
 *                 type: string
 *               value:
 *                 type: number
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produto criado
 *       401:
 *         description: Erro ao criar produto
 */
router.post('/', authenticateToken, createProduct);

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Listar todos os produtos. Only Authenticated
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Listar todos os produtos
 *       401:
 *         description: Erro ao listar produtos
 */
router.get('/', authenticateToken, getAllProducts);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Listar produto por ID. Only Authenticated
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto a ser listado
 *     responses:
 *       200:
 *         description: Produto listado por ID
 *       401:
 *         description: Erro ao listar produto
 */
router.get('/:id', authenticateToken, getProductById);

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Atualizar produto por ID. Only Authenticated
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               credit:
 *                 type: number
 *               validateDate:
 *                 type: number
 *               productTypeId:
 *                 type: string
 *               placeId:
 *                 type: string
 *               value:
 *                 type: number
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produto atualizado
 *       401:
 *         description: Erro ao atualizar produto
 */
router.put('/:id', authenticateToken, updateProduct);

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Deletar produto por ID. Only Authenticated
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do produto a ser deletado
 *     responses:
 *       200:
 *         description: Produto deletado
 *       401:
 *         description: Erro ao deletar produto
 */
router.post('/remove/:id', authenticateToken, deleteProduct);

/**
 * @swagger
 * /product/dropdown/{productTypeId}:
 *   get:
 *     summary: Listar produtos por tipo de produto (dropdown). Only Authenticated
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: productTypeId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do tipo de produto
 *     responses:
 *       200:
 *         description: Produtos listados no dropdown
 *       401:
 *         description: Erro ao listar produtos
 */
router.get('/dropdown/:productTypeId', authenticateToken, getDropdownProducts);

export default router;
