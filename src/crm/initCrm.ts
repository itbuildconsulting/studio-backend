import sequelize from '../config/database';
import EmailTemplate  from '../models/EmailTemplate.model';
import AutomationRule from '../models/AutomationRule.model';
import EmailLog       from '../models/EmailLog.model';
import PushLog        from '../models/PushLog.model';
import PushTemplate   from '../models/PushTemplate.model';

// O MySQL deste servidor nao suporta a sintaxe "ADD COLUMN IF NOT EXISTS"
// (gera ER_PARSE_ERROR). Checa a existencia da coluna via INFORMATION_SCHEMA
// antes de tentar adicionar, pra funcionar em qualquer versao.
async function addColumnIfMissing(table: string, column: string, definition: string): Promise<void> {
  const [rows]: any = await sequelize.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    { replacements: [table, column] },
  );
  if (rows.length === 0) {
    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`[CRM] Coluna ${table}.${column} adicionada`);
  }
}

export async function initCrmTables(): Promise<void> {
  // Create new CRM tables if they don't exist yet
  await EmailTemplate.sync();
  await AutomationRule.sync();
  await EmailLog.sync();
  await PushLog.sync();
  await PushTemplate.sync();

  // Add push_url (legacy, kept for backward compat)
  await addColumnIfMissing('automation_rules', 'push_url', 'VARCHAR(500) NULL');

  // Add channel and push_template_id columns
  await addColumnIfMissing('automation_rules', 'channel', "ENUM('email','push') NOT NULL DEFAULT 'email'");
  await addColumnIfMissing('automation_rules', 'push_template_id', 'INT UNSIGNED NULL');

  // Allow template_id to be NULL (push-only rules have no email template)
  await sequelize.query(
    'ALTER TABLE automation_rules MODIFY COLUMN template_id INT UNSIGNED NULL',
  );

  // Extend trigger_type ENUM to include periodic
  await sequelize.query(
    "ALTER TABLE automation_rules MODIFY COLUMN trigger_type ENUM('welcome','plan_expiring','credits_low','student_inactive','birthday','post_class','win_back','periodic') NOT NULL",
  );

  // Add header customization columns to email_templates
  await addColumnIfMissing('email_templates', 'header_color', 'VARCHAR(255) NULL');
  await addColumnIfMissing('email_templates', 'header_logo_url', 'VARCHAR(255) NULL');

  // Add url to push_templates (ignored if already exists)
  await addColumnIfMissing('push_templates', 'url', 'VARCHAR(500) NULL');

  // Add checkin_at to classStudent
  await addColumnIfMissing('classStudent', 'checkin_at', 'DATETIME NULL');

  // View that exposes studentId as user_id and joins class.date as class_date,
  // so the CRM engine can use the same "last past class" logic as the statistics alerts.
  await sequelize.query(`
    CREATE OR REPLACE VIEW crm_class_students AS
    SELECT
      cs.id,
      cs.classId,
      cs.studentId  AS user_id,
      cs.checkin,
      cs.checkin_at,
      c.date        AS class_date,
      cs.bikeId, cs.status, cs.transactionId,
      cs.createdAt, cs.updatedAt
    FROM classStudent cs
    JOIN \`class\` c ON cs.classId = c.id
  `);

  console.log('[CRM] Tables and view ready');
}
