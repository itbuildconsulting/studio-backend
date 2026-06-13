import { CrmDb } from '../../types';
export declare class EmailSender {
    private readonly db;
    private readonly clientId;
    constructor(db: CrmDb, clientId: string);
    run(): Promise<{
        sent: number;
        failed: number;
    }>;
    private static metaValueToString;
    private buildVars;
    private render;
    private injectPixel;
}
//# sourceMappingURL=EmailSender.d.ts.map