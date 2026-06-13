"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendManualPush = exports.getPushRecipients = exports.getLogStats = exports.runEngine = exports.testTemplate = exports.listLogs = exports.deleteRule = exports.toggleRule = exports.updateRule = exports.createRule = exports.getRule = exports.listRules = exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getTemplate = exports.listTemplates = void 0;
exports.makeTrackOpenHandler = makeTrackOpenHandler;
const sequelize_1 = require("sequelize");
const CrmEngine_1 = require("../engine/CrmEngine");
const emailTransport_1 = require("../engine/emailTransport");
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
        const { name, description, subject, body_html, category } = req.body;
        if (!name || !subject || !body_html || !category) {
            return res.status(400).json({ success: false, message: 'name, subject, body_html e category são obrigatórios' });
        }
        const template = await EmailTemplate.create({ name, description, subject, body_html, category });
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
        const { name, description, subject, body_html, category, active } = req.body;
        await template.update({ name, description, subject, body_html, category, active });
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
        const { AutomationRule, EmailTemplate } = getDb(req);
        const { active } = req.query;
        const where = {};
        if (active !== undefined)
            where.active = active === 'true';
        const rules = await AutomationRule.findAll({
            where,
            include: [{ model: EmailTemplate, as: 'template', attributes: ['id', 'name', 'subject', 'category'] }],
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
        const { AutomationRule, EmailTemplate } = getDb(req);
        const { name, description, trigger_type, trigger_config, template_id, delay_value, delay_unit, push_title, push_body } = req.body;
        if (!name || !trigger_type || !template_id) {
            return res.status(400).json({ success: false, message: 'name, trigger_type e template_id são obrigatórios' });
        }
        const template = await EmailTemplate.findByPk(template_id);
        if (!template)
            return res.status(404).json({ success: false, message: 'Template não encontrado' });
        const rule = await AutomationRule.create({
            name, description,
            trigger_type,
            trigger_config: trigger_config ? JSON.stringify(trigger_config) : null,
            template_id: Number(template_id),
            delay_value: delay_value ?? 0,
            delay_unit: delay_unit ?? 'hours',
            push_title: push_title ?? null,
            push_body: push_body ?? null,
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
        const { AutomationRule, EmailTemplate } = getDb(req);
        const rule = await AutomationRule.findByPk(Number(req.params.id));
        if (!rule)
            return res.status(404).json({ success: false, message: 'Regra não encontrada' });
        const { name, description, trigger_type, trigger_config, template_id, delay_value, delay_unit, active, push_title, push_body } = req.body;
        if (template_id) {
            const template = await EmailTemplate.findByPk(template_id);
            if (!template)
                return res.status(404).json({ success: false, message: 'Template não encontrado' });
        }
        await rule.update({
            name, description, trigger_type,
            trigger_config: trigger_config === undefined ? rule.trigger_config : JSON.stringify(trigger_config),
            template_id: template_id ? Number(template_id) : rule.template_id,
            delay_value, delay_unit, active,
            push_title: push_title === undefined ? rule.push_title : (push_title || null),
            push_body: push_body === undefined ? rule.push_body : (push_body || null),
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
        const html = render(template.body_html);
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
            attributes: ['id', 'name', 'email'],
            where: { id: personIds, active: true },
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
        const result = await (0, pushService_1.sendPushToPersons)(getDb(req), ids, {
            title: title.trim(),
            body: body.trim(),
        });
        return res.json({ success: true, data: result });
    }
    catch (err) {
        console.error('sendManualPush error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao enviar notificações' });
    }
};
exports.sendManualPush = sendManualPush;
//# sourceMappingURL=CrmController.js.map