"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSender = void 0;
const emailTransport_1 = require("./emailTransport");
const BATCH_SIZE = 50;
class EmailSender {
    constructor(db, clientId) {
        this.db = db;
        this.clientId = clientId;
    }
    async run() {
        const pending = await this.db.EmailLog.findAll({
            where: { status: 'pending' },
            include: [
                { model: this.db.ClientUser, as: 'user', attributes: ['id', 'name', 'email'] },
                { model: this.db.EmailTemplate, as: 'template', attributes: ['id', 'body_html'] },
            ],
            order: [['createdAt', 'ASC']],
            limit: BATCH_SIZE,
        });
        let sent = 0;
        let failed = 0;
        for (const log of pending) {
            try {
                const rendered = this.render(log.template?.body_html ?? '', this.buildVars(log));
                const html = this.injectPixel(rendered, log.id);
                await (0, emailTransport_1.getTransport)().sendMail({
                    from: `${process.env.EMAIL_FROM_NAME ?? 'Avera'} <${process.env.EMAIL_USER}>`,
                    to: log.to_email,
                    subject: log.subject,
                    html,
                });
                await log.update({ status: 'sent', sent_at: new Date() });
                sent++;
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                await log.update({ status: 'failed', error_message: msg.slice(0, 500) });
                failed++;
                console.error(`[EmailSender] Failed to send log ${log.id}:`, msg);
            }
        }
        return { sent, failed };
    }
    static metaValueToString(v) {
        if (v == null)
            return '';
        if (typeof v === 'object')
            return JSON.stringify(v);
        if (typeof v === 'string')
            return v;
        if (typeof v === 'number')
            return String(v);
        if (typeof v === 'boolean')
            return String(v);
        return '';
    }
    buildVars(log) {
        const user = log.user;
        const meta = log.metadata ? JSON.parse(log.metadata) : {};
        const stringMeta = Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, EmailSender.metaValueToString(v)]));
        return {
            nome: user?.name ?? '',
            email: user?.email ?? log.to_email,
            ...stringMeta,
        };
    }
    render(template, vars) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
    }
    injectPixel(html, logId) {
        const base = (process.env.BACKEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
        const pixel = `<img src="${base}/api/crm/track/open/${this.clientId}/${logId}" `
            + `width="1" height="1" alt="" style="display:none" />`;
        return html.includes('</body>')
            ? html.replace('</body>', `${pixel}</body>`)
            : `${html}${pixel}`;
    }
}
exports.EmailSender = EmailSender;
//# sourceMappingURL=EmailSender.js.map