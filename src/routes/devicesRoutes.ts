import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken';
import NotificationToken from '../models/NotificationToken.model';
import Expo from 'expo-server-sdk/build/ExpoClient';

const router = Router();

// Registrar (ou atualizar) token de push
router.post('/register', authenticateToken, async (req, res) => {
 try {
    const { personId, token, platform, deviceName } = req.body ?? {};

    // validações básicas
    const id = Number(personId);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'invalid_personId' });
    }
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'missing_token' });
    }
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ success: false, error: 'invalid_expo_token', token });
    }

    // normaliza plataforma p/ enum
    const plat =
      String(platform)?.toLowerCase() === 'ios' ? 'iOS' :
      String(platform)?.toLowerCase() === 'android' ? 'Android' :
      String(platform)?.toLowerCase() === 'web' ? 'Web' : 'Unknown';

    // UPSERT por token (token é UNIQUE). Se já existir, só atualiza.
    const [row, created] = await NotificationToken.findOrCreate({
      where: { token },
      defaults: {
        personId: id,
        token,
        platform: plat,
        deviceName: deviceName ?? null,
        enabled: true,
        lastSeenAt: new Date(),
      },
    });

    if (!created) {
      await row.update({
        personId: id,            // reatacha pra este usuário
        platform: platform,
        deviceName: deviceName ?? row.deviceName,
        enabled: true,
        lastSeenAt: new Date(),
      });
    }

    return res.json({
      success: true,
      id: row.id,
      created,
    });
  } catch (e: any) {
    // erros clássicos do MySQL
    const code = e?.original?.code || e?.code;

    if (code === 'ER_NO_REFERENCED_ROW_2') {
      // FK personId -> people(id) falhou
      return res.status(400).json({ success: false, error: 'person_not_found' });
    }
    if (code === 'ER_DUP_ENTRY') {
      // concorrência rara: tente atualizar
      try {
        const row = await NotificationToken.findOne({ where: { token: req.body.token } });
        if (row) {
          await row.update({
            personId: Number(req.body.personId),
            platform: req.body.platform ?? row.platform,
            deviceName: req.body.deviceName ?? row.deviceName,
            enabled: true,
            lastSeenAt: new Date(),
          });
          return res.json({ success: true, id: row.id, created: false });
        }
      } catch {}
    }

    console.error('[devices/register] error:', e);
    return res.status(500).json({ success: false, error: 'internal_error', detail: e?.message || String(e) });
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
