"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmEngine = void 0;
const sequelize_1 = require("sequelize");
const pushService_1 = require("../../push/pushService");
class CrmEngine {
    constructor(db) {
        this.db = db;
    }
    async run() {
        const rules = await this.db.AutomationRule.findAll({
            where: { active: true },
            include: [{ model: this.db.EmailTemplate, as: 'template', attributes: ['id', 'subject', 'body_html'] }],
        });
        let queued = 0;
        for (const rule of rules) {
            try {
                queued += await this.evalRule(rule);
            }
            catch (err) {
                console.error(`[CrmEngine] Rule ${rule.id} (${rule.name}) error:`, err);
            }
        }
        return { processed: rules.length, queued };
    }
    async evalRule(rule) {
        const config = rule.trigger_config ? JSON.parse(rule.trigger_config) : {};
        let users = [];
        switch (rule.trigger_type) {
            case 'welcome':
                users = await this.evalWelcome(rule, config);
                break;
            case 'plan_expiring':
                users = await this.evalPlanExpiring(rule, config);
                break;
            case 'credits_low':
                users = await this.evalCreditsLow(rule, config);
                break;
            case 'student_inactive':
                users = await this.evalStudentInactive(rule, config);
                break;
            case 'birthday':
                users = await this.evalBirthday(rule, config);
                break;
            case 'post_class':
                users = await this.evalPostClass(rule, config);
                break;
            case 'win_back':
                users = await this.evalWinBack(rule, config);
                break;
            default:
                console.warn(`[CrmEngine] Unknown trigger_type: ${rule.trigger_type}`);
                return 0;
        }
        if (users.length === 0)
            return 0;
        const cooldownHours = this.cooldownHours(rule.trigger_type);
        const eligible = await this.filterByCooldown(users, rule.id, cooldownHours);
        if (eligible.length === 0)
            return 0;
        await this.queueLogs(eligible, rule);
        if (rule.push_title && rule.push_body) {
            try {
                await (0, pushService_1.sendPushToPersons)(this.db, eligible.map((u) => u.id), {
                    title: rule.push_title,
                    body: rule.push_body,
                    data: rule.push_url ? { url: rule.push_url } : undefined,
                });
            }
            catch (err) {
                console.error(`[CrmEngine] Push failed for rule ${rule.id}:`, err);
            }
        }
        return eligible.length;
    }
    // 1. Welcome — first StudentCredit created in the last 2 hours
    async evalWelcome(_rule, _config) {
        const since = new Date(Date.now() - 2 * 3600000);
        const recent = await this.db.StudentCredit.findAll({
            attributes: ['userId'],
            where: { createdAt: { [sequelize_1.Op.gte]: since } },
            include: [{ model: this.db.ClientUser, as: 'user', attributes: ['id', 'email', 'name'], where: { active: true } }],
        });
        const result = [];
        for (const credit of recent) {
            const user = credit.user;
            if (!user)
                continue;
            const total = await this.db.StudentCredit.count({ where: { userId: user.id } });
            if (total === 1)
                result.push({ id: user.id, email: user.email, name: user.name });
        }
        return result;
    }
    // 2. Plan expiring in N days (default 7), ±12 h window
    async evalPlanExpiring(_rule, config) {
        const days = config.days ?? 7;
        const target = new Date(Date.now() + days * 86400000);
        const half = 12 * 3600000;
        const credits = await this.db.StudentCredit.findAll({
            attributes: ['userId'],
            where: {
                status: 'active',
                availableCredits: { [sequelize_1.Op.gt]: 0 },
                expiresAt: { [sequelize_1.Op.between]: [new Date(target.getTime() - half), new Date(target.getTime() + half)] },
            },
            include: [{ model: this.db.ClientUser, as: 'user', attributes: ['id', 'email', 'name'], where: { active: true } }],
        });
        return this.uniqueUsers(credits);
    }
    // 3. Credits low — total active credits < threshold (default 2)
    async evalCreditsLow(_rule, config) {
        const threshold = config.threshold ?? 2;
        const now = new Date();
        const credits = await this.db.StudentCredit.findAll({
            attributes: ['userId', 'availableCredits'],
            where: { status: 'active', expiresAt: { [sequelize_1.Op.gte]: now }, availableCredits: { [sequelize_1.Op.gt]: 0 } },
            include: [{ model: this.db.ClientUser, as: 'user', attributes: ['id', 'email', 'name'], where: { active: true } }],
        });
        const sums = new Map();
        for (const c of credits) {
            const user = c.user;
            if (!user)
                continue;
            const entry = sums.get(user.id);
            if (entry) {
                entry.total += c.availableCredits;
            }
            else {
                sums.set(user.id, { user: { id: user.id, email: user.email, name: user.name }, total: c.availableCredits });
            }
        }
        return Array.from(sums.values()).filter(({ total }) => total < threshold).map(({ user }) => user);
    }
    // 4. Student inactive — was active before, but not in the last min_days days (default 14)
    async evalStudentInactive(_rule, config) {
        const minDays = config.min_days ?? 14;
        const cutoff = new Date(Date.now() - minDays * 86400000);
        const everCheckedIn = await this.db.ClassStudent.findAll({
            attributes: [[(0, sequelize_1.col)('user_id'), 'user_id']],
            where: { checkin: true },
            group: ['user_id'],
            raw: true,
        });
        const everIds = everCheckedIn.map(r => r.user_id);
        if (everIds.length === 0)
            return [];
        const recentRows = await this.db.ClassStudent.findAll({
            attributes: [[(0, sequelize_1.col)('user_id'), 'user_id']],
            where: { checkin: true, checkin_at: { [sequelize_1.Op.gte]: cutoff } },
            group: ['user_id'],
            raw: true,
        });
        const recentIds = new Set(recentRows.map(r => r.user_id));
        const inactiveIds = everIds.filter(id => !recentIds.has(id));
        if (inactiveIds.length === 0)
            return [];
        const users = await this.db.ClientUser.findAll({
            attributes: ['id', 'email', 'name'],
            where: { active: true, id: { [sequelize_1.Op.in]: inactiveIds } },
        });
        return users.map(u => ({ id: u.id, email: u.email, name: u.name }));
    }
    // 5. Birthday — today is the user's birthday
    async evalBirthday(_rule, _config) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const users = await this.db.ClientUser.findAll({
            attributes: ['id', 'email', 'name', 'birthday'],
            where: { active: true, birthday: { [sequelize_1.Op.not]: null } },
        });
        return users
            .filter(u => {
            if (!u.birthday)
                return false;
            const b = new Date(u.birthday);
            return b.getMonth() + 1 === month && b.getDate() === day;
        })
            .map(u => ({ id: u.id, email: u.email, name: u.name }));
    }
    // 6. Post class — user checked in exactly rule.delay ago (±30 min)
    async evalPostClass(rule, _config) {
        const delayMs = this.delayToMs(rule.delay_value, rule.delay_unit);
        const target = new Date(Date.now() - delayMs);
        const half = 30 * 60000;
        const enrollments = await this.db.ClassStudent.findAll({
            attributes: ['user_id'],
            where: {
                checkin: true,
                checkin_at: { [sequelize_1.Op.between]: [new Date(target.getTime() - half), new Date(target.getTime() + half)] },
            },
            include: [{ model: this.db.ClientUser, as: 'student', attributes: ['id', 'email', 'name'], where: { active: true } }],
        });
        return this.uniqueUsers(enrollments);
    }
    // 7. Win back — credit expired N days ago, no active credits left (default 30 days)
    async evalWinBack(_rule, config) {
        const daysAfter = config.days_after_expiry ?? 30;
        const target = new Date(Date.now() - daysAfter * 86400000);
        const half = 12 * 3600000;
        const expiredCredits = await this.db.StudentCredit.findAll({
            attributes: ['userId'],
            where: {
                status: { [sequelize_1.Op.in]: ['expired', 'exhausted'] },
                expiresAt: { [sequelize_1.Op.between]: [new Date(target.getTime() - half), new Date(target.getTime() + half)] },
            },
            include: [{ model: this.db.ClientUser, as: 'user', attributes: ['id', 'email', 'name'], where: { active: true } }],
        });
        const candidates = this.uniqueUsers(expiredCredits);
        if (candidates.length === 0)
            return [];
        const now = new Date();
        const stillActiveIds = await this.db.StudentCredit.findAll({
            attributes: [[(0, sequelize_1.col)('userId'), 'userId']],
            where: {
                userId: { [sequelize_1.Op.in]: candidates.map(u => u.id) },
                status: 'active',
                expiresAt: { [sequelize_1.Op.gte]: now },
                availableCredits: { [sequelize_1.Op.gt]: 0 },
            },
            group: ['userId'],
            raw: true,
        }).then((rows) => new Set(rows.map((r) => r.userId)));
        return candidates.filter(u => !stillActiveIds.has(u.id));
    }
    // ─── Helpers ─────────────────────────────────────────────────────────────────
    async filterByCooldown(users, ruleId, cooldownHours) {
        if (cooldownHours <= 0)
            return users;
        const since = new Date(Date.now() - cooldownHours * 3600000);
        const recentLogs = await this.db.EmailLog.findAll({
            attributes: ['user_id'],
            where: {
                rule_id: ruleId,
                user_id: { [sequelize_1.Op.in]: users.map(u => u.id) },
                createdAt: { [sequelize_1.Op.gte]: since },
            },
            raw: true,
        });
        const recentIds = new Set(recentLogs.map(r => r.user_id));
        return users.filter(u => !recentIds.has(u.id));
    }
    async queueLogs(users, rule) {
        const template = rule.template;
        if (!template)
            return;
        await this.db.EmailLog.bulkCreate(users.map(user => ({
            user_id: user.id,
            rule_id: rule.id,
            template_id: rule.template_id,
            to_email: user.email,
            subject: this.resolveSubject(template.subject, { nome: user.name }),
            status: 'pending',
            metadata: JSON.stringify({ trigger_type: rule.trigger_type }),
        })));
    }
    resolveSubject(subject, vars) {
        return subject.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
    }
    cooldownHours(triggerType) {
        const map = {
            welcome: 0,
            plan_expiring: 24,
            credits_low: 72,
            student_inactive: 168,
            birthday: 24 * 365,
            post_class: 24,
            win_back: 168,
        };
        return map[triggerType] ?? 24;
    }
    delayToMs(value, unit) {
        if (unit === 'minutes')
            return value * 60000;
        if (unit === 'hours')
            return value * 3600000;
        return value * 86400000;
    }
    uniqueUsers(rows) {
        const seen = new Set();
        const result = [];
        for (const row of rows) {
            const user = row.user ?? row.student;
            if (!user || seen.has(user.id))
                continue;
            seen.add(user.id);
            result.push({ id: user.id, email: user.email, name: user.name });
        }
        return result;
    }
}
exports.CrmEngine = CrmEngine;
//# sourceMappingURL=CrmEngine.js.map