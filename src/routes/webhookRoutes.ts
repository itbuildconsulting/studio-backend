import express, { Router } from 'express';
import { pagarmeWebhook } from '../controllers/webhookController';

const router: Router = express.Router();

// POST /webhook/pagarme
// Chamado automaticamente pela Pagar.me quando um pagamento é confirmado.
// Não usa authenticateToken — a autenticação é feita via HMAC no header X-Hub-Signature.
router.post('/pagarme', pagarmeWebhook);

export default router;