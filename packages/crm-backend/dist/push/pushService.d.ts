import { CrmDb } from '../types';
export interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, unknown>;
}
export declare function sendPushToPersons(db: CrmDb, personIds: number[], payload: PushPayload): Promise<{
    sent: number;
    disabled: number;
}>;
//# sourceMappingURL=pushService.d.ts.map