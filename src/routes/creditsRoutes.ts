import { Router } from 'express';
import {
  purchaseCreditsController,
  consumeCreditsController,
  cancelBatchIfUnusedController,
  refundRemainingByBatchController,
  expireDueCreditsController,
  getBalanceByProductController,
  listCustomerCreditsController,
  checkAvailabilityController,
  revertConsumptionController,
} from '../controllers/creditController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

// todas com auth (ajuste conforme necessidade)
router.post('/credits/purchase', authenticateToken, purchaseCreditsController);
router.post('/credits/consume', authenticateToken, consumeCreditsController);
router.post('/credits/cancel-batch', authenticateToken, cancelBatchIfUnusedController);
router.post('/credits/refund-batch', authenticateToken, refundRemainingByBatchController);
router.post('/credits/expire', authenticateToken, expireDueCreditsController);

router.get('/credits/balance/:customerId', authenticateToken, getBalanceByProductController);
router.get('/credits/list/:customerId', authenticateToken, listCustomerCreditsController);

router.post('/credits/availability', authenticateToken, checkAvailabilityController);

// opcional (se tiver ledger)
router.post('/credits/revert-consumption', authenticateToken, revertConsumptionController);

export default router;
