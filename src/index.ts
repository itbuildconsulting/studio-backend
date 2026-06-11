import app from './app';
import { startLevelUpdateJob } from './jobs/levelUpdateJob';
import { initCrmTables } from './crm/initCrm';
import { runCrmForAllTenants, runEmailSenderForAllTenants } from '@avera/crm-backend';
import { crmDb } from './crm/crmDb';

const getStudioDb = async () => [{ slug: 'studio', db: crmDb }];

// ✅ Adicionar aqui
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

  await initCrmTables().catch(err => console.error('[CRM] initCrmTables error:', err));

  setInterval(() => {
    runCrmForAllTenants(getStudioDb).catch(err => console.error('[CRM] engine error:', err));
  }, 60 * 60 * 1000); // hourly

  setInterval(() => {
    runEmailSenderForAllTenants(getStudioDb).catch(err => console.error('[CRM] sender error:', err));
  }, 5 * 60 * 1000); // every 5 min
});
