import { Router } from 'express';
import { verifyOtp, sendOtp, verifyEmailByToken, verifyEmailByTokenJson } from '../controllers/optController';

const router = Router();

// Verifica o código de 6 dígitos digitado no app
router.post('/otp/verify', verifyOtp);

// Reenvio de código pelo app
router.post('/otp/send', sendOtp);

// Ativação via botão do e-mail (link mágico), resposta HTML
// GET /auth/verify?token=xxx
router.get('/verify', verifyEmailByToken);

// Mesma ativação em JSON, consumida pela página /verify do front-end
// POST /auth/verify  { token }
router.post('/verify', verifyEmailByTokenJson);

export default router;