import app from './app';
import { startLevelUpdateJob } from './jobs/levelUpdateJob';
import { startTurmaScheduler } from './jobs/turmaScheduler';
import Coupon from './models/Coupon.model';
import CouponUsage from './models/CouponUsage.model';
import Nps from './models/Nps.model';
import Turma from './models/Turma.model';
import TurmaSlot from './models/TurmaSlot.model';
import sequelize from './config/database';

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

const timestamp = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

console.log   = (...args) => originalConsole.log(`[${timestamp()}]`, ...args);
console.error = (...args) => originalConsole.error(`[${timestamp()}]`, ...args);
console.warn  = (...args) => originalConsole.warn(`[${timestamp()}]`, ...args);
console.info  = (...args) => originalConsole.info(`[${timestamp()}]`, ...args);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  startLevelUpdateJob();
  startTurmaScheduler();

  // Garante criação das tabelas novas no banco (no-op se já existirem)
  await Nps.sync().catch((err: Error) => console.error('[Sync] Nps error:', err));
  await Coupon.sync().catch((err: Error) => console.error('[Sync] Coupon error:', err));
  await CouponUsage.sync().catch((err: Error) => console.error('[Sync] CouponUsage error:', err));
  // Adiciona colunas se ainda não existirem
  const addColIfMissing = async (table: string, column: string, definition: string) => {
    const [rows]: any = await sequelize.query(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      { replacements: [table, column] },
    );
    if (rows.length === 0) {
      await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`[Sync] Coluna ${table}.${column} adicionada`);
    }
  };

  await Turma.sync().catch((err: Error) => console.error('[Sync] Turma error:', err));
  await TurmaSlot.sync().catch((err: Error) => console.error('[Sync] TurmaSlot error:', err));
  await addColIfMissing('class', 'turmaId', 'INT UNSIGNED NULL').catch((err: Error) => console.error('[Sync] turmaId migration error:', err));
  await addColIfMissing('transactions', 'couponCode', 'VARCHAR(50) NULL').catch((err: Error) => console.error('[Sync] couponCode migration error:', err));
  await addColIfMissing('transactions', 'discountAmount', 'INT NULL').catch((err: Error) => console.error('[Sync] discountAmount migration error:', err));

  if (process.env.CRM_ENABLED === 'true') {
    try {
      const { initCrmTables } = require('./crm/initCrm');
      const { runCrmForAllTenants, runEmailSenderForAllTenants } = require('@avera/crm-backend');
      const { crmDb } = require('./crm/crmDb');
      const getStudioDb = async () => [{ slug: 'studio', db: crmDb }];

      await initCrmTables().catch((err: Error) => console.error('[CRM] initCrmTables error:', err));

      setInterval(() => {
        runCrmForAllTenants(getStudioDb).catch((err: Error) => console.error('[CRM] engine error:', err));
      }, 60 * 60 * 1000);

      setInterval(() => {
        runEmailSenderForAllTenants(getStudioDb).catch((err: Error) => console.error('[CRM] sender error:', err));
      }, 5 * 60 * 1000);

      console.log('[CRM] Scheduler iniciado');
    } catch (e) {
      console.warn('[CRM] Módulo não disponível, scheduler desabilitado:', (e as Error).message);
    }
  }
});
