"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToPersons = sendPushToPersons;
const expo_server_sdk_1 = require("expo-server-sdk");
const expo = new expo_server_sdk_1.Expo();
async function sendPushToPersons(db, personIds, payload) {
    if (personIds.length === 0)
        return { sent: 0, disabled: 0 };
    const rows = await db.NotificationToken.findAll({
        where: { personId: personIds, enabled: true },
        attributes: ['token'],
        raw: true,
    });
    const tokenSet = new Set();
    for (const r of rows) {
        if (expo_server_sdk_1.Expo.isExpoPushToken(r.token))
            tokenSet.add(r.token);
    }
    const tokens = Array.from(tokenSet);
    if (tokens.length === 0)
        return { sent: 0, disabled: 0 };
    const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        channelId: 'default',
        priority: 'high',
    }));
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    let disabled = 0;
    for (const chunk of chunks) {
        try {
            const res = await expo.sendPushNotificationsAsync(chunk);
            for (let i = 0; i < res.length; i++) {
                const t = res[i];
                if (t.status === 'error' && t?.details?.error === 'DeviceNotRegistered') {
                    const token = chunk[i].to;
                    await db.NotificationToken.update({ enabled: false }, { where: { token } });
                    disabled++;
                }
            }
            tickets.push(...res);
        }
        catch (err) {
            console.error('[push] erro ao enviar chunk:', err);
        }
    }
    // Fire-and-forget receipt check (não bloqueia o caller)
    void collectReceipts(tickets);
    return { sent: tokens.length, disabled };
}
async function collectReceipts(tickets) {
    const ids = tickets
        .filter((t) => t.status === 'ok' && t.id)
        .map((t) => t.id);
    if (ids.length === 0)
        return;
    for (const chunk of expo.chunkPushNotificationReceiptIds(ids)) {
        try {
            const receipts = (await expo.getPushNotificationReceiptsAsync(chunk));
            for (const [id, r] of Object.entries(receipts)) {
                if (r.status !== 'ok') {
                    console.error('[push] receipt error', id, r);
                }
            }
        }
        catch (err) {
            console.error('[push] erro ao consultar receipts:', err);
        }
    }
}
//# sourceMappingURL=pushService.js.map