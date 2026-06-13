import sequelize from '../config/database';
import EmailTemplate  from '../models/EmailTemplate.model';
import AutomationRule from '../models/AutomationRule.model';
import EmailLog       from '../models/EmailLog.model';
import PushLog        from '../models/PushLog.model';
import PushTemplate   from '../models/PushTemplate.model';

export async function initCrmTables(): Promise<void> {
  // Create new CRM tables if they don't exist yet
  await EmailTemplate.sync();
  await AutomationRule.sync();
  await EmailLog.sync();
  await PushLog.sync();
  await PushTemplate.sync();

  // Add checkin_at to classStudent (MySQL ignores ADD COLUMN if already exists via IF NOT EXISTS)
  await sequelize.query(
    'ALTER TABLE classStudent ADD COLUMN IF NOT EXISTS checkin_at DATETIME NULL',
  );

  // Create a view that exposes studentId as user_id (required by CrmEngine column references)
  await sequelize.query(`
    CREATE OR REPLACE VIEW crm_class_students AS
    SELECT
      id, classId,
      studentId  AS user_id,
      checkin,
      checkin_at,
      bikeId, status, transactionId,
      createdAt, updatedAt
    FROM classStudent
  `);

  console.log('[CRM] Tables and view ready');
}
