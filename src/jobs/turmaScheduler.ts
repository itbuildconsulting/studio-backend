import cron from 'node-cron';
import { generateClassesForAllActiveTurmas } from '../services/turmaService';

export function startTurmaScheduler(): void {
  // Roda todo dia às 01:00 e às 13:00 (duas vezes ao dia)
  cron.schedule('0 1,13 * * *', async () => {
    console.log('[CRON] Iniciando geração de aulas das turmas...');
    try {
      const result = await generateClassesForAllActiveTurmas();
      console.log(`[CRON] Turmas: ${result.total} processadas, ${result.created} aulas geradas, ${result.errors} erros`);
    } catch (error) {
      console.error('[CRON] Erro na geração de aulas das turmas:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  console.log('[Turma] Scheduler iniciado (01:00 e 13:00 diariamente)');
}
