"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDevicesRouter = createDevicesRouter;
const express_1 = require("express");
const expo_server_sdk_1 = require("expo-server-sdk");
function createDevicesRouter(authenticateStudent) {
    const router = (0, express_1.Router)();
    // POST /devices/register — chamada pelo app ao abrir (upsert idempotente)
    router.post('/register', authenticateStudent, async (req, res) => {
        try {
            const { NotificationToken } = req.tenantDb;
            const personId = req.student.studentId;
            const { token, platform, deviceName } = req.body;
            if (!token || typeof token !== 'string') {
                return res.status(400).json({ success: false, message: 'token é obrigatório' });
            }
            if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
                return res.status(400).json({ success: false, message: 'token Expo inválido' });
            }
            const platLower = typeof platform === 'string' ? platform.toLowerCase() : '';
            let plat;
            if (platLower === 'ios') {
                plat = 'iOS';
            }
            else if (platLower === 'android') {
                plat = 'Android';
            }
            else {
                plat = 'Unknown';
            }
            const deviceNameStr = typeof deviceName === 'string' ? deviceName : null;
            const [row, created] = await NotificationToken.findOrCreate({
                where: { token },
                defaults: {
                    personId, token, platform: plat,
                    deviceName: deviceNameStr,
                    enabled: true, lastSeenAt: new Date(),
                },
            });
            if (!created) {
                await row.update({
                    personId,
                    platform: plat,
                    deviceName: deviceNameStr ?? row.deviceName,
                    enabled: true,
                    lastSeenAt: new Date(),
                });
            }
            return res.json({ success: true, id: row.id, created });
        }
        catch (err) {
            console.error('[devices/register]', err);
            return res.status(500).json({ success: false, message: 'Erro ao registrar device' });
        }
    });
    // POST /devices/unregister — chamada no logout
    router.post('/unregister', authenticateStudent, async (req, res) => {
        try {
            const { NotificationToken } = req.tenantDb;
            const { token } = req.body;
            if (!token || typeof token !== 'string') {
                return res.status(400).json({ success: false, message: 'token é obrigatório' });
            }
            await NotificationToken.destroy({ where: { token } });
            return res.json({ success: true });
        }
        catch (err) {
            console.error('[devices/unregister]', err);
            return res.status(500).json({ success: false, message: 'Erro ao remover device' });
        }
    });
    return router;
}
//# sourceMappingURL=devices.routes.js.map