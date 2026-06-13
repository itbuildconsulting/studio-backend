import { Model, Optional } from 'sequelize';
export type EmailTemplateCategory = 'retention' | 'engagement' | 'revenue' | 'transactional';
interface EmailTemplateAttributes {
    id: number;
    name: string;
    description?: string | null;
    subject: string;
    body_html: string;
    category: EmailTemplateCategory;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface EmailTemplateCreationAttributes extends Optional<EmailTemplateAttributes, 'id' | 'description' | 'active'> {
}
declare class EmailTemplate extends Model<EmailTemplateAttributes, EmailTemplateCreationAttributes> implements EmailTemplateAttributes {
    id: number;
    name: string;
    description: string | null;
    subject: string;
    body_html: string;
    category: EmailTemplateCategory;
    active: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default EmailTemplate;
//# sourceMappingURL=EmailTemplate.model.d.ts.map