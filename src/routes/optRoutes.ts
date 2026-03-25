import { Router } from 'express';
import { verifyOtp, sendOtp, verifyEmailByToken } from '../controllers/optController';

const router = Router();

// Verifica o código de 6 dígitos digitado no app
router.post('/otp/verify', verifyOtp);

// Reenvio de código pelo app
router.post('/otp/send', sendOtp);

// Ativação via botão do e-mail (link mágico)
// GET /auth/verify?token=xxx
router.get('/verify', verifyEmailByToken);

export default router;