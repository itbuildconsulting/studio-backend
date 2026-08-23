"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPushLogs = exports.deletePushTemplate = exports.updatePushTemplate = exports.createPushTemplate = exports.listPushTemplates = exports.sendManualPush = exports.getPushRecipients = exports.getLogStats = exports.runEngine = exports.testTemplate = exports.listLogs = exports.deleteRule = exports.toggleRule = exports.updateRule = exports.createRule = exports.getRule = exports.listRules = exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getTemplate = exports.listTemplates = void 0;
exports.makeTrackOpenHandler = makeTrackOpenHandler;
const sequelize_1 = require("sequelize");
const CrmEngine_1 = require("../engine/CrmEngine");
const emailTransport_1 = require("../engine/emailTransport");
const emailHtml_1 = require("../engine/emailHtml");
const pushService_1 = require("../../push/pushService");
const getDb = (req) => req.tenantDb;
// ─── EmailTemplate ────────────────────────────────────────────────────────────
const listTemplates = async (req, res) => {
    try {
        const { EmailTemplate } = getDb(req);
        const { category, active } = req.query;
        const where = {};
        if (category)
            where.category = category;
        if (active !== undefined)
            where.active = active === 'true';
        const templates = await EmailTemplate.findAll({
            where,
            order: [['category', 'ASC'], ['name', 'ASC']],
        });
        return res.json({ success: true, data: templates });
    }
    catch (err) {
        console.error('listTemplates error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao listar templates' });
    }
};
exports.listTemplates = listTemplates;
const getTemplate = async (req, res) => {
    try {
        const { EmailTemplate } = getDb(req);
        const template = await EmailTemplate.findByPk(Number(req.params.id));
        if (!template)
            return res.status(404).json({ success: false, message: 'Template não encontrado' });
        return res.json({ success: true, data: template });
    }
    catch (err) {
        console.error('getTemplate error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao buscar template' });
    }
};
exports.getTemplate = getTemplate;
const createTemplate = async (req, res) => {
    try {
        const { EmailTemplate } = getDb(req);
        const { name, description, subject, body_html, category, header_color, header_logo_url } = req.body;
        if (!name || !subject || !body_html || !category) {
            return res.status(400).json({ success: false, message: 'name, subject, body_html e category são obrigatórios' });
        }
        const template = await EmailTemplate.create({ name, description, subject, body_html, category, header_color, header_logo_url });
        return res.status(201).json({ success: true, data: template, message: 'Template criado com sucesso' });
    }
    catch (err) {
        console.error('createTemplate error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao criar template' });
    }
};
exports.createTemplate = createTemplate;
const updateTemplate = async (req, res) => {
    try {
        const { EmailTemplate } = getDb(req);
        const template = await EmailTemplate.findByPk(Number(req.params.id));
        if (!template)
            return res.status(404).json({ success: false, message: 'Template não encontrado' });
        const { name, description, subject, body_html, category, active, header_color, header_logo_url } = req.body;
        await template.update({ name, description, subject, body_html, category, active, header_color, header_logo_url });
        return res.json({ success: true, data: template, message: 'Template atualizado com sucesso' });
    }
    catch (err) {
        console.error('updateTemplate error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar template' });
    }
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res) => {
    try {
        const { EmailTemplate, AutomationRule } = getDb(req);
        const template = await EmailTemplate.findByPk(Number(req.params.id));
        if (!template)
            return res.status(404).json({ success: false, message: 'Template não encontrado' });
        const rulesCount = await AutomationRule.count({ where: { template_id: template.id, active: true } });
        if (rulesCount > 0) {
            return res.status(409).json({
                success: false,
                message: `Este template está em uso por ${rulesCount} regra(s) ativa(s). Desative-as antes de remover.`,
            });
        }
        await template.destroy();
        return res.json({ success: true, message: 'Template removido com sucesso' });
    }
    catch (err) {
        console.error('deleteTemplate error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao remover template' });
    }
};
exports.deleteTemplate = deleteTemplate;
// ─── AutomationRule ───────────────────────────────────────────────────────────
const listRules = async (req, res) => {
    try {
        const { AutomationRule, EmailTemplate, PushTemplate } = getDb(req);
        const { active } = req.query;
        const where = {};
        if (active !== undefined)
            where.active = active === 'true';
        const rules = await AutomationRule.findAll({
            where,
            include: [
                { model: EmailTemplate, as: 'template', attributes: ['id', 'name', 'subject', 'category'] },
                { model: PushTemplate, as: 'pushTemplate', attributes: ['id', 'name', 'title', 'body'] },
            ],
            order: [['trigger_type', 'ASC'], ['name', 'ASC']],
        });
        return res.json({ success: true, data: rules });
    }
    catch (err) {
        console.error('listRules error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao listar regras' });
    }
};
exports.listRules = listRules;
const getRule = async (req, res) => {
    try {
        const { AutomationRule, EmailTemplate } = getDb(req);
        const rule = await AutomationRule.findByPk(Number(req.params.id), {
            include: [{ model: EmailTemplate, as: 'template' }],
        });
        if (!rule)
            return res.status(404).json({ success: false, message: 'Regra não encontrada' });
        return res.json({ success: true, data: rule });
    }
    catch (err) {
        console.error('getRule error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao buscar regra' });
    }
};
exports.getRule = getRule;
const createRule = async (req, res) => {
    try {
        const { AutomationRule, EmailTemplate, PushTemplate } = getDb(req);
        const { name, description, trigger_type, trigger_config, channel = 'email', template_id, push_template_id, delay_value, delay_unit } = req.body;
        if (!name || !trigger_type) {
            return res.status(400).json({ success: false, message: 'name e trigger_type são obrigatórios' });
        }
        if (channel === 'email') {
            if (!template_id)
                return res.status(400).json({ success: false, message: 'template_id é obrigatório para canal e-mail' });
            const tmpl = await EmailTemplate.findByPk(template_id);
            if (!tmpl)
                return res.status(404).json({ success: false, message: 'Template de e-mail não encontrado' });
        }
        if (channel === 'push') {
            if (!push_template_id)
                return res.status(400).json({ success: false, message: 'push_template_id é obrigatório para canal push' });
            const ptmpl = await PushTemplate.findByPk(push_template_id);
            if (!ptmpl)
                return res.status(404).json({ success: false, message: 'Template de push não encontrado' });
        }
        const rule = await AutomationRule.create({
            name, description,
            trigger_type,
            trigger_config: trigger_config ? JSON.stringify(trigger_config) : null,
            channel,
            template_id: channel === 'email' ? Number(template_id) : null,
            push_template_id: channel === 'push' ? Number(push_template_id) : null,
            delay_value: delay_value ?? 0,
            delay_unit: delay_unit ?? 'hours',
        });
        return res.status(201).json({ success: true, data: rule, message: 'Regra criada com sucesso' });
    }
    catch (err) {
        console.error('createRule error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao criar regra' });
    }
};
exports.createRule = createRule;
const updateRule = async (req, res) => {
    try {
        const { AutomationRule, EmailTemplate, PushTemplate } = getDb(req);
        const rule = await AutomationRule.findByPk(Number(req.params.id));
        if (!rule)
            return res.status(404).json({ success: false, message: 'Regra não encontrada' });
        const { name, description, trigger_type, trigger_config, channel, template_id, push_template_id, delay_value, delay_unit, active } = req.body;
        const newChannel = channel ?? rule.channel ?? 'email';
        if (newChannel === 'email' && template_id) {
            const tmpl = await EmailTemplate.findByPk(template_id);
            if (!tmpl)
                return res.status(404).json({ success: false, message: 'Template de e-mail não encontrado' });
        }
        if (newChannel === 'push' && push_template_id) {
            const ptmpl = await PushTemplate.findByPk(push_template_id);
            if (!ptmpl)
                return res.status(404).json({ success: false, message: 'Template de push não encontrado' });
        }
        await rule.update({
            name, description, trigger_type,
            trigger_config: trigger_config === undefined ? rule.trigger_config : JSON.stringify(trigger_config),
            channel: newChannel,
            template_id: newChannel === 'email'
                ? (template_id !== undefined ? (template_id ? Number(template_id) : null) : rule.template_id)
                : null,
            push_template_id: newChannel === 'push'
                ? (push_template_id !== undefined ? (push_template_id ? Number(push_template_id) : null) : rule.push_template_id)
                : null,
            delay_value, delay_unit, active,
        });
        return res.json({ success: true, data: rule, message: 'Regra atualizada com sucesso' });
    }
    catch (err) {
        console.error('updateRule error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar regra' });
    }
};
exports.updateRule = updateRule;
const toggleRule = async (req, res) => {
    try {
        const { AutomationRule } = getDb(req);
        const rule = await AutomationRule.findByPk(Number(req.params.id));
        if (!rule)
            return res.status(404).json({ success: false, message: 'Regra não encontrada' });
        await rule.update({ active: !rule.active });
        return res.json({
            success: true,
            data: rule,
            message: rule.active ? 'Regra ativada com sucesso' : 'Regra desativada com sucesso',
        });
    }
    catch (err) {
        console.error('toggleRule error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao alterar status da regra' });
    }
};
exports.toggleRule = toggleRule;
const deleteRule = async (req, res) => {
    try {
        const { AutomationRule } = getDb(req);
        const rule = await AutomationRule.findByPk(Number(req.params.id));
        if (!rule)
            return res.status(404).json({ success: false, message: 'Regra não encontrada' });
        await rule.destroy();
        return res.json({ success: true, message: 'Regra removida com sucesso' });
    }
    catch (err) {
        console.error('deleteRule error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao remover regra' });
    }
};
exports.deleteRule = deleteRule;
// ─── EmailLog ─────────────────────────────────────────────────────────────────
const listLogs = async (req, res) => {
    try {
        const { EmailLog, AutomationRule, EmailTemplate } = getDb(req);
        const { user_id, rule_id, status, limit = '50', offset = '0' } = req.query;
        const where = {};
        if (user_id)
            where.user_id = Number(user_id);
        if (rule_id)
            where.rule_id = Number(rule_id);
        if (status)
            where.status = status;
        const { rows, count } = await EmailLog.findAndCountAll({
            where,
            include: [
                { model: AutomationRule, as: 'rule', attributes: ['id', 'name', 'trigger_type'] },
                { model: EmailTemplate, as: 'template', attributes: ['id', 'name', 'category'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: Math.min(Number(limit), 200),
            offset: Number(offset),
        });
        return res.json({ success: true, data: rows, meta: { total: count } });
    }
    catch (err) {
        console.error('listLogs error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao listar logs' });
    }
};
exports.listLogs = listLogs;
// ─── Template Test Send ───────────────────────────────────────────────────────
const testTemplate = async (req, res) => {
    try {
        const { EmailTemplate, EmailLog } = getDb(req);
        const template = await EmailTemplate.findByPk(Number(req.params.id));
        if (!template)
            return res.status(404).json({ success: false, message: 'Template não encontrado' });
        const { to_email } = req.body;
        if (!to_email)
            return res.status(400).json({ success: false, message: 'to_email é obrigatório' });
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(503).json({ success: false, message: 'SMTP não configurado no servidor (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)' });
        }
        const render = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => ({ nome: 'Aluno Teste', email: to_email })[key] ?? `{{${key}}}`);
        const subject = `[TESTE] ${render(template.subject)}`;
        const renderedBody = render(template.body_html);
        const html = (0, emailHtml_1.buildEmailHtml)({
            bodyHtml: renderedBody,
            headerColor: template.header_color,
            headerLogoUrl: template.header_logo_url,
        });
        await (0, emailTransport_1.getTransport)().sendMail({
            from: `${process.env.EMAIL_FROM_NAME ?? 'Avera'} <${process.env.EMAIL_USER}>`,
            to: to_email,
            subject,
            html,
        });
        await EmailLog.create({
            to_email,
            subject,
            template_id: template.id,
            status: 'sent',
            sent_at: new Date(),
            metadata: JSON.stringify({ test: true }),
        });
        return res.json({ success: true, message: `E-mail de teste enviado para ${to_email}` });
    }
    catch (err) {
        const detail = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('testTemplate error:', err);
        return res.status(500).json({ success: false, message: `Erro ao enviar e-mail de teste: ${detail}` });
    }
};
exports.testTemplate = testTemplate;
// ─── Engine ───────────────────────────────────────────────────────────────────
const runEngine = async (req, res) => {
    try {
        const result = await new CrmEngine_1.CrmEngine(getDb(req)).run();
        return res.json({ success: true, data: result });
    }
    catch (err) {
        console.error('runEngine error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao executar engine CRM' });
    }
};
exports.runEngine = runEngine;
const getLogStats = async (req, res) => {
    try {
        const { EmailLog } = getDb(req);
        const { days = '30' } = req.query;
        const since = new Date();
        since.setDate(since.getDate() - Number(days));
        const rows = await EmailLog.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: since } },
            attributes: ['status'],
            raw: true,
        });
        const stats = { total: rows.length, pending: 0, sent: 0, failed: 0, opened: 0 };
        for (const r of rows) {
            const s = r.status;
            if (s in stats)
                stats[s]++;
        }
        return res.json({ success: true, data: stats });
    }
    catch (err) {
        console.error('getLogStats error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
    }
};
exports.getLogStats = getLogStats;
// ─── Open Tracking ────────────────────────────────────────────────────────────
// 1×1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
function makeTrackOpenHandler(getTenantDbBySlug) {
    return async (req, res) => {
        res.set('Content-Type', 'image/gif');
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.end(PIXEL);
        const { clientId, logId } = req.params;
        try {
            const db = await getTenantDbBySlug(clientId);
            if (!db)
                return;
            const log = await db.EmailLog.findByPk(Number(logId));
            if (log?.status === 'sent') {
                await log.update({ status: 'opened', opened_at: new Date() });
            }
        }
        catch {
            // silent — never fail over a tracking pixel
        }
    };
}
// ─── Push Manual ──────────────────────────────────────────────────────────────
const getPushRecipients = async (req, res) => {
    try {
        const { NotificationToken, ClientUser } = getDb(req);
        // Conta tokens ativos por personId em uma query
        const tokenCounts = await NotificationToken.findAll({
            attributes: ['personId', [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'tokenCount']],
            where: { enabled: true },
            group: ['personId'],
            raw: true,
        });
        if (tokenCounts.length === 0)
            return res.json({ success: true, data: [] });
        const personIds = tokenCounts.map((r) => r.personId);
        const users = await ClientUser.findAll({
            attributes: ['id', 'name', 'email', 'active'],
            where: { id: personIds },
            order: [['name', 'ASC']],
            raw: true,
        });
        const countMap = new Map(tokenCounts.map((r) => [r.personId, Number(r.tokenCount)]));
        const data = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            tokenCount: countMap.get(u.id) ?? 0,
        }));
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('getPushRecipients error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao buscar destinatários' });
    }
};
exports.getPushRecipients = getPushRecipients;
const sendManualPush = async (req, res) => {
    try {
        const { personIds, title, body } = req.body;
        if (!Array.isArray(personIds) || personIds.length === 0) {
            return res.status(400).json({ success: false, message: 'personIds é obrigatório e não pode estar vazio' });
        }
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ success: false, message: 'title é obrigatório' });
        }
        if (!body || typeof body !== 'string' || !body.trim()) {
            return res.status(400).json({ success: false, message: 'body é obrigatório' });
        }
        const ids = personIds.map(Number).filter((id) => Number.isFinite(id) && id > 0);
        if (ids.length === 0) {
            return res.status(400).json({ success: false, message: 'personIds inválidos' });
        }
        const db = getDb(req);
        const url = typeof req.body.url === 'string' ? req.body.url.trim() : undefined;
        const hasVars = /\{\{\w+\}\}/.test(title) || /\{\{\w+\}\}/.test(body);
        let result;
        if (hasVars) {
            const users = await db.ClientUser.findAll({
                attributes: ['id', 'name', 'email'],
                where: { id: ids },
                raw: true,
            });
            let sent = 0;
            let disabled = 0;
            const renderText = (text, vars) => text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
            for (const user of users) {
                const vars = { nome: user.name, email: user.email };
                const r = await (0, pushService_1.sendPushToPersons)(db, [user.id], {
                    title: renderText(title.trim(), vars),
                    body: renderText(body.trim(), vars),
                    data: url ? { url } : undefined,
                });
                sent += r.sent;
                disabled += r.disabled;
            }
            result = { sent, disabled };
        }
        else {
            result = await (0, pushService_1.sendPushToPersons)(db, ids, {
                title: title.trim(),
                body: body.trim(),
                data: url ? { url } : undefined,
            });
        }
        const status = result.sent === 0 ? 'failed' : result.sent < ids.length ? 'partial' : 'sent';
        await db.PushLog.create({
            title: title.trim(),
            body: body.trim(),
            recipient_count: ids.length,
            sent_count: result.sent,
            disabled_count: result.disabled,
            person_ids: JSON.stringify(ids),
            status,
            sent_at: new Date(),
        });
        return res.json({ success: true, data: result });
    }
    catch (err) {
        console.error('sendManualPush error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao enviar notificações' });
    }
};
exports.sendManualPush = sendManualPush;
// ─── Push Templates ───────────────────────────────────────────────────────────
const listPushTemplates = async (req, res) => {
    try {
        const { PushTemplate } = getDb(req);
        const templates = await PushTemplate.findAll({ order: [['name', 'ASC']] });
        return res.json({ success: true, data: templates });
    }
    catch (err) {
        console.error('listPushTemplates error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao listar templates de push' });
    }
};
exports.listPushTemplates = listPushTemplates;
const createPushTemplate = async (req, res) => {
    try {
        const { PushTemplate } = getDb(req);
        const { name, title, body, url } = req.body;
        if (!name || !title || !body) {
            return res.status(400).json({ success: false, message: 'name, title e body são obrigatórios' });
        }
        const template = await PushTemplate.create({
            name: name.trim(), title: title.trim(), body: body.trim(),
            url: url ? url.trim() : null,
        });
        return res.status(201).json({ success: true, data: template, message: 'Template criado com sucesso' });
    }
    catch (err) {
        console.error('createPushTemplate error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao criar template de push' });
    }
};
exports.createPushTemplate = createPushTemplate;
const updatePushTemplate = async (req, res) => {
    try {
        const { PushTemplate } = getDb(req);
        const template = await PushTemplate.findByPk(Number(req.params.id));
        if (!template)
            return res.status(404).json({ success: false, message: 'Template não encontrado' });
        const { name, title, body, url } = req.body;
        await template.update({
            ...(name !== undefined ? { name: name.trim() } : {}),
            ...(title !== undefined ? { title: title.trim() } : {}),
            ...(body !== undefined ? { body: body.trim() } : {}),
            ...(url !== undefined ? { url: url ? url.trim() : null } : {}),
        });
        return res.json({ success: true, data: template, message: 'Template atualizado com sucesso' });
    }
    catch (err) {
        console.error('updatePushTemplate error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar template de push' });
    }
};
exports.updatePushTemplate = updatePushTemplate;
const deletePushTemplate = async (req, res) => {
    try {
        const { PushTemplate } = getDb(req);
        const template = await PushTemplate.findByPk(Number(req.params.id));
        if (!template)
            return res.status(404).json({ success: false, message: 'Template não encontrado' });
        await template.destroy();
        return res.json({ success: true, message: 'Template removido com sucesso' });
    }
    catch (err) {
        console.error('deletePushTemplate error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao remover template de push' });
    }
};
exports.deletePushTemplate = deletePushTemplate;
const listPushLogs = async (req, res) => {
    try {
        const { PushLog } = getDb(req);
        const limit = Math.min(Number(req.query.limit ?? 50), 200);
        const offset = Number(req.query.offset ?? 0);
        const { rows, count } = await PushLog.findAndCountAll({
            order: [['sent_at', 'DESC']],
            limit,
            offset,
        });
        return res.json({ success: true, data: rows, meta: { total: count } });
    }
    catch (err) {
        console.error('listPushLogs error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao listar histórico de push' });
    }
};
exports.listPushLogs = listPushLogs;
//# sourceMappingURL=CrmController.js.map