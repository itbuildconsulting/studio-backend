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
    header_color?: string | null;
    header_logo_url?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface EmailTemplateCreationAttributes extends Optional<EmailTemplateAttributes, 'id' | 'description' | 'active' | 'header_color' | 'header_logo_url'> {
}
declare class EmailTemplate extends Model<EmailTemplateAttributes, EmailTemplateCreationAttributes> implements EmailTemplateAttributes {
    id: number;
    name: string;
    description: string | null;
    subject: string;
    body_html: string;
    category: EmailTemplateCategory;
    active: boolean;
    header_color: string | null;
    header_logo_url: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default EmailTemplate;
//# sourceMappingURL=EmailTemplate.model.d.ts.map