import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import NotificationToken from '../models/NotificationToken.model';

const expo = new Expo();

export async function sendPushToPersons(
  personIds: number[],
  payload: { title: string; body: string; data?: any }
) {
  const tokens = await NotificationToken.findAll({
    where: { personId: personIds, enabled: true },
    attributes: ['token'],
    raw: true,
  });

  const messages: ExpoPushMessage[] = tokens
    .filter(t => Expo.isExpoPushToken(t.token))
    .map(t => ({
      to: t.token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      channelId: 'default',
      priority: 'high',
    }));

  if (messages.length === 0) return { tickets: [], total: 0 };

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      console.error('Erro ao enviar chunk de push:', err);
    }
  }

  // Se quiser, aqui você pode persistir ticketIds para checar receipts depois.
  return { tickets, total: messages.length };
}
