// routes/notifications.ts
import { Router } from 'express';
import { sendPushToPersons } from '../services/pushService';
import { ExpoPushMessage, ExpoPushTicket, Expo } from 'expo-server-sdk';
import NotificationToken from '../models/NotificationToken.model';
import ClassStudent from '../models/ClassStudent.model';
import Nps from '../models/Nps.model';
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

// Envia notificação NPS para alunos de uma aula específica
router.post('/send-class-nps', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId) {
      return res.status(400).json({ success: false, message: 'classId é obrigatório' });
    }

    // Busca alunos que fizeram checkin na aula
    const enrollments = await ClassStudent.findAll({
      where: { classId, checkin: 1, status: true },
      attributes: ['studentId'],
    });

    if (!enrollments.length) {
      return res.status(404).json({ success: false, message: 'Nenhum aluno com checkin nesta aula' });
    }

    const studentIds = enrollments.map((e: any) => e.studentId).filter(Boolean) as number[];

    // Filtra quem já avaliou
    const existing = await Nps.findAll({
      where: { classId, studentId: studentIds },
      attributes: ['studentId'],
    });
    const alreadyVoted = new Set(existing.map((n: any) => n.studentId));
    const pending = studentIds.filter(id => !alreadyVoted.has(id));

    if (!pending.length) {
      return res.json({ success: true, message: 'Todos os alunos já avaliaram esta aula', sent: 0 });
    }

    const result = await sendPushToPersons(pending, {
      title: 'Como foi sua aula? ⭐',
      body: 'Avalie sua experiência e nos ajude a melhorar!',
      data: { screen: 'npsVoting', classId: Number(classId) },
    });

    return res.json({ ...result, sent: pending.length, skipped: alreadyVoted.size });
  } catch (e: any) {
    console.error('[push] /send-class-nps erro', e);
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
