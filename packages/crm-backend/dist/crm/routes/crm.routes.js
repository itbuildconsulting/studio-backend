"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CrmController_1 = require("../controllers/CrmController");
const router = (0, express_1.Router)();
// ─── Templates ────────────────────────────────────────────────────────────────
router.get('/templates', CrmController_1.listTemplates);
router.post('/templates', CrmController_1.createTemplate);
router.get('/templates/:id', CrmController_1.getTemplate);
router.put('/templates/:id', CrmController_1.updateTemplate);
router.delete('/templates/:id', CrmController_1.deleteTemplate);
router.post('/templates/:id/test', CrmController_1.testTemplate);
// ─── Automation Rules ─────────────────────────────────────────────────────────
router.get('/rules', CrmController_1.listRules);
router.post('/rules', CrmController_1.createRule);
router.get('/rules/:id', CrmController_1.getRule);
router.put('/rules/:id', CrmController_1.updateRule);
router.patch('/rules/:id/toggle', CrmController_1.toggleRule);
router.delete('/rules/:id', CrmController_1.deleteRule);
// ─── Email Logs ───────────────────────────────────────────────────────────────
router.get('/logs', CrmController_1.listLogs);
router.get('/logs/stats', CrmController_1.getLogStats);
// ─── Engine (manual trigger for testing) ─────────────────────────────────────
router.post('/engine/run', CrmController_1.runEngine);
// ─── Push Manual ──────────────────────────────────────────────────────────────
router.get('/push/recipients', CrmController_1.getPushRecipients);
router.post('/push/send', CrmController_1.sendManualPush);
router.get('/push/logs', CrmController_1.listPushLogs);
// ─── Push Templates ───────────────────────────────────────────────────────────
router.get('/push/templates', CrmController_1.listPushTemplates);
router.post('/push/templates', CrmController_1.createPushTemplate);
router.put('/push/templates/:id', CrmController_1.updatePushTemplate);
router.delete('/push/templates/:id', CrmController_1.deletePushTemplate);
exports.default = router;
//# sourceMappingURL=crm.routes.js.map