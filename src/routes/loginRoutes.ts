import { Router } from 'express';
import { login } from '../controllers/loginController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Operações de autenticação
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realiza o login do usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/', login);


export default router;
