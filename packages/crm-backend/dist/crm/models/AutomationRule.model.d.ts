import { Model, Optional } from 'sequelize';
export type TriggerType = 'welcome' | 'plan_expiring' | 'credits_low' | 'student_inactive' | 'birthday' | 'post_class' | 'win_back';
export type DelayUnit = 'minutes' | 'hours' | 'days';
interface AutomationRuleAttributes {
    id: number;
    name: string;
    description?: string | null;
    trigger_type: TriggerType;
    trigger_config?: string | null;
    template_id: number;
    delay_value: number;
    delay_unit: DelayUnit;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface AutomationRuleCreationAttributes extends Optional<AutomationRuleAttributes, 'id' | 'description' | 'trigger_config' | 'delay_value' | 'delay_unit' | 'active'> {
}
declare class AutomationRule extends Model<AutomationRuleAttributes, AutomationRuleCreationAttributes> implements AutomationRuleAttributes {
    id: number;
    name: string;
    description: string | null;
    trigger_type: TriggerType;
    trigger_config: string | null;
    template_id: number;
    delay_value: number;
    delay_unit: DelayUnit;
    active: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default AutomationRule;
//# sourceMappingURL=AutomationRule.model.d.ts.map