import { Router } from 'express';
import { seedController } from '../controllers/seedController';
import { authenticateToken } from '../core/token/authenticateToken'; // Middleware de autenticação

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Seed
 *   description: Operações de sincronização e inserção de dados iniciais
 */

/**
 * @swagger
 * /seed:
 *   post:
 *     summary: Sincroniza as tabelas do banco de dados. Only Authenticated
 *     tags: [Seed]
 *     responses:
 *       200:
 *         description: Tabelas sincronizadas com sucesso
 *       400:
 *         description: Erro ao sincronizar as tabelas
 */
router.post('/', authenticateToken, seedController.post);

/**
 * @swagger
 * /seed/addFirstData:
 *   post:
 *     summary: Insere dados iniciais no banco de dados. Only Authenticated
 *     tags: [Seed]
 *     responses:
 *       200:
 *         description: Dados inseridos com sucesso
 *       400:
 *         description: Erro ao inserir dados
 */
router.post('/addFirstData', authenticateToken, seedController.addFirstData);

export default router;
