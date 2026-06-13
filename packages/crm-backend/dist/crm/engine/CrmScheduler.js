"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCrmForAllTenants = runCrmForAllTenants;
exports.runEmailSenderForAllTenants = runEmailSenderForAllTenants;
const CrmEngine_1 = require("./CrmEngine");
const EmailSender_1 = require("./EmailSender");
async function runCrmForAllTenants(getTenantDbs) {
    const tenants = await getTenantDbs();
    for (const { slug, db } of tenants) {
        try {
            const result = await new CrmEngine_1.CrmEngine(db).run();
            if (result.queued > 0) {
                console.log(`[CrmEngine] ${slug}: ${result.processed} rules → ${result.queued} emails queued`);
            }
        }
        catch (err) {
            console.error(`[CrmEngine] Tenant ${slug} error:`, err);
        }
    }
}
async function runEmailSenderForAllTenants(getTenantDbs) {
    const tenants = await getTenantDbs();
    for (const { slug, db } of tenants) {
        try {
            const result = await new EmailSender_1.EmailSender(db, slug).run();
            if (result.sent > 0 || result.failed > 0) {
                console.log(`[EmailSender] ${slug}: ${result.sent} sent, ${result.failed} failed`);
            }
        }
        catch (err) {
            console.error(`[EmailSender] Tenant ${slug} error:`, err);
        }
    }
}
//# sourceMappingURL=CrmScheduler.js.map