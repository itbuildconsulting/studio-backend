import express, { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken';
import * as financialController from '../controllers/financialController';

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Financial
 *   description: Financial operations
 */

/**
 * @swagger
 * /financial/transactions:
 *   get:
 *     summary: Retrieve the latest transactions
 *     tags: [Financial]
 *     responses:
 *       200:
 *         description: A list of transactions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/lastTransactions', authenticateToken, financialController.getLatestTransactions);


router.get('/transaction/:transactionId', authenticateToken, financialController.getTransactionById);

export default router;
