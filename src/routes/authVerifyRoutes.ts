// src/routes/authVerifyRoutes.ts
import { Router } from 'express';
import { verifyEmailLink } from '../controllers/authVerifyController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth Verification
 *   description: Verificação de email via magic link
 */

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verifica o email através do magic link
 *     tags: [Auth Verification]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token JWT de verificação de email
 *     responses:
 *       200:
 *         description: Página HTML de sucesso - conta verificada
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Token inválido ou expirado
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/verify', verifyEmailLink);

export default router;