// src/routes/contractRoutes.ts
import { Router } from 'express';
import {
  getActiveContract,
  signContract,
  checkContractStatus,
  getStudentSignature,
  getStudentsWithoutContract,
} from '../controllers/contractController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contratos
 *   description: Gestão de contratos e assinaturas digitais
 */

/**
 * @swagger
 * /contracts/active:
 *   get:
 *     summary: Buscar contrato ativo (versão mais recente)
 *     tags: [Contratos]
 *     responses:
 *       200:
 *         description: Contrato ativo encontrado
 */
router.get('/active', getActiveContract);

/**
 * @swagger
 * /contracts/{studentId}/status:
 *   get:
 *     summary: Verificar se aluno precisa assinar contrato
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:studentId/status', authenticateToken, checkContractStatus);

/**
 * @swagger
 * /contracts/{studentId}/sign:
 *   post:
 *     summary: Assinar contrato digitalmente
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractVersionId
 *               - acceptedTerms
 *               - acceptedPrivacy
 *               - acceptedDataProcessing
 *             properties:
 *               contractVersionId:
 *                 type: integer
 *               acceptedTerms:
 *                 type: boolean
 *               acceptedPrivacy:
 *                 type: boolean
 *               acceptedImageUse:
 *                 type: boolean
 *               acceptedDataProcessing:
 *                 type: boolean
 */
router.post('/:studentId/sign', authenticateToken, signContract);

/**
 * @swagger
 * /contracts/{studentId}/signature:
 *   get:
 *     summary: Buscar assinatura atual do aluno
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:studentId/signature', authenticateToken, getStudentSignature);

/**
 * @swagger
 * /contracts/students/without:
 *   get:
 *     summary: Listar alunos que ainda não assinaram o contrato (Admin)
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/students/without', authenticateToken, getStudentsWithoutContract);

export default router;