// services/pushService.ts
import {
  Expo,
  ExpoPushMessage,
  ExpoPushTicket,
  ExpoPushReceipt,
} from 'expo-server-sdk';
import NotificationToken from '../models/NotificationToken.model';

const expo = new Expo();

const log = (...a: any[]) => console.log('[push]', ...a);

// Resultado forte p/ acabar com 'any[]'
export interface PushSendResult {
  success: boolean;
  total: number;
  tickets: ExpoPushTicket[];
  info?: string;
  error?: string;
}

function isSuccessTicket(t: ExpoPushTicket): t is ExpoPushTicket & { id: string } {
  // Na união de tipos, só o ticket 'ok' tem id
  return (t as any)?.status === 'ok' && typeof (t as any)?.id === 'string';
}

export async function sendPushToPersons(
  personIds: number[],
  payload: { title: string; body: string; data?: Record<string, any> }
): Promise<PushSendResult> {
  const rows = await NotificationToken.findAll({
    where: { personId: personIds, enabled: true },
    attributes: ['personId', 'token'],
    raw: true,
  });

  const uniqueTokens = Array.from(new Set(rows.map(r => r.token)));
  const validTokens = uniqueTokens.filter(t => Expo.isExpoPushToken(t));
  const invalidTokens = uniqueTokens.filter(t => !Expo.isExpoPushToken(t));

  if (invalidTokens.length) log('Tokens inválidos (não Expo):', invalidTokens);

  if (validTokens.length === 0) {
    return { success: true, total: 0, tickets: [] as ExpoPushTicket[], info: 'Sem tokens válidos' };
  }

  const messages: ExpoPushMessage[] = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    channelId: 'default',
    priority: 'high',
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  let invalidCredentials = false;

  for (const chunk of chunks) {
    try {
      const res = await expo.sendPushNotificationsAsync(chunk);

      // Trate erros imediatamente
      for (const t of res) {
        if (t.status === 'error') {
          // t.details?.expoPushToken existe em alguns erros (ex.: DeviceNotRegistered)
          const expoTok = (t as any)?.details?.expoPushToken as string | undefined;

          if ((t as any)?.details?.error === 'DeviceNotRegistered' && expoTok) {
            await NotificationToken.update({ enabled: false }, { where: { token: expoTok } });
            log('Token desativado (DeviceNotRegistered):', expoTok);
          }
          if ((t as any)?.details?.error === 'InvalidCredentials') {
            invalidCredentials = true;
          }
          log('Ticket ERROR:', t.message, (t as any)?.details ?? {});
        }
      }

      tickets.push(...res);
    } catch (err) {
      log('Erro ao enviar chunk:', err);
    }
  }

  // Coleta receipts (podem conter erros tardios)
  await collectReceiptsAndCleanup(tickets);

  if (invalidCredentials) {
    return {
      success: false,
      total: messages.length,
      tickets,
      error:
        'InvalidCredentials: falta credencial FCM no projeto Expo (rode na pasta do app: npx expo push:android:upload).',
    };
  }

  return { success: true, total: messages.length, tickets };
}

async function collectReceiptsAndCleanup(tickets: ExpoPushTicket[]) {
  const ticketIds = tickets.filter(isSuccessTicket).map(t => t.id);
  if (ticketIds.length === 0) return;

  const receiptChunks = expo.chunkPushNotificationReceiptIds(ticketIds);

  for (const chunk of receiptChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      const entries = Object.entries(receipts as Record<string, ExpoPushReceipt>);

      for (const [id, r] of entries) {
        if ((r as any).status === 'ok') continue;

        const details = (r as any)?.details ?? {};
        log('Receipt ERROR', id, details, (r as any)?.message);

        // Nos receipts, não temos o expoPushToken; só logamos.
        // (Se quiser, dá pra manter um mapa id->token quando envia)
      }
    } catch (err) {
      log('Erro ao consultar receipts:', err);
    }
  }
}
