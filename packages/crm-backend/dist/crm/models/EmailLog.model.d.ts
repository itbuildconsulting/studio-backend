import { Model, Optional } from 'sequelize';
export type EmailLogStatus = 'pending' | 'sent' | 'failed' | 'opened';
interface EmailLogAttributes {
    id: number;
    user_id?: number | null;
    rule_id?: number | null;
    template_id?: number | null;
    to_email: string;
    subject: string;
    status: EmailLogStatus;
    error_message?: string | null;
    metadata?: string | null;
    sent_at?: Date | null;
    opened_at?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface EmailLogCreationAttributes extends Optional<EmailLogAttributes, 'id' | 'user_id' | 'rule_id' | 'template_id' | 'status' | 'error_message' | 'metadata' | 'sent_at' | 'opened_at'> {
}
declare class EmailLog extends Model<EmailLogAttributes, EmailLogCreationAttributes> implements EmailLogAttributes {
    id: number;
    user_id: number | null;
    rule_id: number | null;
    template_id: number | null;
    to_email: string;
    subject: string;
    status: EmailLogStatus;
    error_message: string | null;
    metadata: string | null;
    sent_at: Date | null;
    opened_at: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default EmailLog;
//# sourceMappingURL=EmailLog.model.d.ts.map