import cron from 'node-cron';
import Person from '../models/Person.model';
import { updateMultipleStudentLevels } from '../services/levelService';

/**
 * Job que roda todos os dias à meia-noite para atualizar níveis
 */
export function startLevelUpdateJob(): void {
  // Validar se o cron expression é válido
  if (!cron.validate('5 0 * * *')) {
    console.error('❌ Expressão cron inválida');
    return;
  }

  // Roda todo dia às 00:05 (5 minutos após meia-noite)
  cron.schedule('5 0 * * *', async () => {
    console.log('🔄 [CRON] Iniciando atualização automática de níveis...');
    
    try {
      const students = await Person.findAll({
        where: { employee: 0 },
        attributes: ['id'],
      });

      const studentIds = students.map((s) => s.id);
      const result = await updateMultipleStudentLevels(studentIds);

      console.log(`✅ [CRON] Atualização concluída: ${result.updated}/${result.total} níveis atualizados`);
      
      if (result.errors > 0) {
        console.warn(`⚠️ [CRON] ${result.errors} erros durante a atualização`);
      }
    } catch (error) {
      console.error('❌ [CRON] Erro na atualização automática de níveis:', error);
    }
  }, {
    timezone: "America/Sao_Paulo" // Ajuste para seu timezone
  });

  console.log('📅 Job de atualização de níveis agendado (todos os dias às 00:05)');
}

/**
 * Função auxiliar para executar manualmente (útil para testes)
 */
export async function runLevelUpdateManually(): Promise<{
  success: boolean;
  total: number;
  updated: number;
  errors: number;
}> {
  console.log('🔄 [MANUAL] Executando atualização de níveis...');
  
  try {
    const students = await Person.findAll({
      where: { employee: 0 },
      attributes: ['id'],
    });

    const studentIds = students.map((s) => s.id);
    const result = await updateMultipleStudentLevels(studentIds);

    console.log(`✅ [MANUAL] Concluído: ${result.updated}/${result.total} atualizados, ${result.errors} erros`);
    
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('❌ [MANUAL] Erro:', error);
    return {
      success: false,
      total: 0,
      updated: 0,
      errors: 1,
    };
  }
}