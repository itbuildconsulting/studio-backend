import type { ModelStatic } from 'sequelize';
import type { Request } from 'express';
export interface CrmDb {
    EmailTemplate: ModelStatic<any>;
    AutomationRule: ModelStatic<any>;
    EmailLog: ModelStatic<any>;
    PushLog: ModelStatic<any>;
    PushTemplate: ModelStatic<any>;
    NotificationToken: ModelStatic<any>;
    ClientUser: ModelStatic<any>;
    StudentCredit: ModelStatic<any>;
    ClassStudent: ModelStatic<any>;
}
export type GetTenantDbBySlug = (slug: string) => Promise<CrmDb | null>;
export type TenantDbEntry = {
    slug: string;
    db: CrmDb;
};
export type GetTenantDbsFn = () => Promise<TenantDbEntry[]>;
export interface CrmRequest extends Request {
    tenantDb: CrmDb;
    student?: {
        studentId: number;
    };
}
//# sourceMappingURL=types.d.ts.map