import { CrmDb } from '@avera/crm-backend';
import EmailTemplate   from '../models/EmailTemplate.model';
import AutomationRule  from '../models/AutomationRule.model';
import EmailLog        from '../models/EmailLog.model';
import PushLog         from '../models/PushLog.model';
import NotificationToken from '../models/NotificationToken.model';
import Person          from '../models/Person.model';
import CrmStudentCredit from './adapters/CrmStudentCredit';
import CrmClassStudent  from './adapters/CrmClassStudent';

export const crmDb: CrmDb = {
  EmailTemplate,
  AutomationRule,
  EmailLog,
  PushLog,
  NotificationToken,
  ClientUser:    Person           as any,
  StudentCredit: CrmStudentCredit as any,
  ClassStudent:  CrmClassStudent  as any,
};
