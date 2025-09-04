import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken';
import NotificationToken from '../models/NotificationToken.model';

const router = Router();

// Registrar (ou atualizar) token de push
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { personId, token, platform, deviceName } = req.body;
    if (!personId || !token) return res.status(400).json({ success: false, message: 'personId e token são obrigatórios' });

    await NotificationToken.upsert({
      personId,
      token,
      platform: platform ?? 'Unknown',
      deviceName,
      enabled: true,
      lastSeenAt: new Date(),
    });

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false });
  }
});

// Desregistrar (logout/opt-out)
router.post('/unregister', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'token é obrigatório' });
    await NotificationToken.destroy({ where: { token } });
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false });
  }
});

export default router;
