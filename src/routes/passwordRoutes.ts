import { Router } from 'express';
import { requestPasswordReset, resetPassword } from '../controllers/loginController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Operações de autenticação e recuperação de senha
 */

/**
 * @swagger
 * /request-reset:
 *   post:
 *     summary: Solicita a redefinição de senha
 *     tags: [Auth]
 *     description: Envia um link de redefinição de senha para o e-mail fornecido, se o e-mail estiver registrado no sistema.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: O e-mail registrado no sistema para o qual o link de redefinição de senha será enviado
 *     responses:
 *       200:
 *         description: Se o e-mail existir no sistema, um link de redefinição será enviado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post('/request-reset', requestPasswordReset);

/**
 * @swagger
 * /reset:
 *   post:
 *     summary: Redefine a senha usando o token
 *     tags: [Auth]
 *     description: Redefine a senha do usuário com base no token enviado no link de redefinição de senha.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: O token de redefinição de senha enviado no link
 *               newPassword:
 *                 type: string
 *                 description: A nova senha que o usuário deseja definir
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso.
 *       400:
 *         description: Token inválido ou expirado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post('/reset', resetPassword);

export default router;
