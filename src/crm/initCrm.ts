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

  // Add push_url (legacy, kept for backward compat)
  await sequelize.query(
    'ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS push_url VARCHAR(500) NULL',
  );

  // Add channel and push_template_id columns
  await sequelize.query(
    "ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS channel ENUM('email','push') NOT NULL DEFAULT 'email'",
  );
  await sequelize.query(
    'ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS push_template_id INT UNSIGNED NULL',
  );

  // Allow template_id to be NULL (push-only rules have no email template)
  await sequelize.query(
    'ALTER TABLE automation_rules MODIFY COLUMN template_id INT UNSIGNED NULL',
  );

  // Extend trigger_type ENUM to include periodic
  await sequelize.query(
    "ALTER TABLE automation_rules MODIFY COLUMN trigger_type ENUM('welcome','plan_expiring','credits_low','student_inactive','birthday','post_class','win_back','periodic') NOT NULL",
  );

  // Add header customization columns to email_templates
  await sequelize.query(
    'ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS header_color VARCHAR(255) NULL',
  );
  await sequelize.query(
    'ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS header_logo_url VARCHAR(255) NULL',
  );

  // Add url to push_templates (ignored if already exists)
  await sequelize.query(
    'ALTER TABLE push_templates ADD COLUMN IF NOT EXISTS url VARCHAR(500) NULL',
  );

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
