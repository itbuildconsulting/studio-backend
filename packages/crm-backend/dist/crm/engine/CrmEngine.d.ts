import { CrmDb } from '../../types';
export declare class CrmEngine {
    private readonly db;
    constructor(db: CrmDb);
    run(): Promise<{
        processed: number;
        queued: number;
    }>;
    private evalRule;
    private evalWelcome;
    private evalPlanExpiring;
    private evalCreditsLow;
    private evalStudentInactive;
    private evalBirthday;
    private evalPostClass;
    private evalWinBack;
    private evalPeriodic;
    private filterByCooldown;
    private queueLogs;
    private resolveSubject;
    private renderText;
    private cooldownHours;
    private delayToMs;
    private uniqueUsers;
}
//# sourceMappingURL=CrmEngine.d.ts.map