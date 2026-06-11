import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken';
import {
  createInstallmentRule,
  updateInstallmentRule,
  deleteInstallmentRule,
  listInstallmentRules,
  getInstallmentRuleById,
} from '../controllers/installmentRulesController';

const router = Router();

// CRUD de regras
router.post('/create', authenticateToken, createInstallmentRule);
router.post('/update', authenticateToken, updateInstallmentRule);
router.get('/delete', authenticateToken, deleteInstallmentRule);
router.get('/list', authenticateToken, listInstallmentRules);
router.get('/details/:id', authenticateToken, getInstallmentRuleById);

export default router;