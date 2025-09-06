// routes/notifications.ts
import { Router } from 'express';
import { sendPushToPersons } from '../services/pushService';
import { ExpoPushMessage, ExpoPushTicket, Expo } from 'expo-server-sdk';
import NotificationToken from '../models/NotificationToken.model';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

// Envio por personIds (produção)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { personIds, title, body, data } = req.body;
    if (!Array.isArray(personIds) || personIds.length === 0) {
      return res.status(400).json({ success: false, message: 'personIds deve ser array com pelo menos 1 id' });
    }
    const result = await sendPushToPersons(personIds, { title, body, data });
    // se InvalidCredentials, 502 deixa claro que é infra externa
    if (result.success === false && String(result.error || '').includes('InvalidCredentials')) {
      return res.status(502).json(result);
    }
    return res.json(result);
  } catch (e: any) {
    console.error('[push] /send erro', e);
    return res.status(500).json({ success: false, error: String(e?.message ?? e) });
  }
});

// Envio direto por token (debug sem depender do DB)
router.post('/send-by-token', authenticateToken, async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    if (!token || !Expo.isExpoPushToken(token)) {
      return res.status(400).json({ success: false, message: 'token inválido (não é um ExpoPushToken)' });
    }
    const result = await sendPushToPersonsWithRawTokens([token], { title, body, data });
    return res.json(result);
  } catch (e: any) {
    console.error('[push] /send-by-token erro', e);
    return res.status(500).json({ success: false, error: String(e?.message ?? e) });
  }
});

// Lista tokens por pessoa (debug rápido)
router.get('/tokens/:personId', authenticateToken, async (req, res) => {
  const personId = Number(req.params.personId);
  const rows = await NotificationToken.findAll({ where: { personId }, order: [['updatedAt', 'DESC']] });
  res.json(rows);
});

export default router;

// helper para envio por tokens crus (apenas debug)

const expo = new Expo();
async function sendPushToPersonsWithRawTokens(tokens: string[], payload: { title: string; body: string; data?: any; }) {
  const valid = tokens.filter(t => Expo.isExpoPushToken(t));
  const messages: ExpoPushMessage[] = valid.map(t => ({
    to: t, sound: 'default', title: payload.title, body: payload.body, data: payload.data ?? {},
    channelId: 'default', priority: 'high',
  }));
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  let invalidCredentials = false;

  for (const chunk of chunks) {
    try {
      const res = await expo.sendPushNotificationsAsync(chunk);
      for (const t of res) {
        if (t.status === 'error') {
          if (t.details?.error === 'InvalidCredentials') invalidCredentials = true;
          console.error('[push] ticket error', t.message, t.details);
        }
      }
      tickets.push(...res);
    } catch (e) {
      console.error('[push] chunk error', e);
    }
  }
  if (invalidCredentials) return { success: false, tickets, total: messages.length, error: 'InvalidCredentials: suba credencial FCM no projeto Expo.' };
  return { success: true, tickets, total: messages.length };
}
