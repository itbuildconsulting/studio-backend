import Person from '../models/Person.model';
import Level from '../models/Level.model';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';
import { Op } from 'sequelize';

/**
 * Conta quantas aulas o aluno completou (aulas passadas com status ativo)
 * @param studentId - ID do aluno
 * @returns número de aulas completadas
 */
export async function countCompletedClasses(studentId: number): Promise<number> {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

  // Contar aulas onde:
  // 1. O aluno está inscrito (ClassStudent.status = 1 ou true)
  // 2. A data/hora da aula já passou
  const completed = await ClassStudent.count({
    where: {
      studentId,
      [Op.or]: [
        { status: 1 },
        { status: true }
      ]
    },
    include: [
      {
        model: Class,
        required: true,
        where: {
          // Aulas que já passaram
          [Op.or]: [
            {
              // Data anterior a hoje
              date: {
                [Op.lt]: today,
              },
            },
            {
              // Mesmo dia mas horário já passou
              date: today,
              time: {
                [Op.lt]: currentTime,
              },
            },
          ],
        },
      },
    ],
  });

  return completed;
}

/**
 * Determina o nível apropriado baseado no número de aulas
 * @param completedClasses - Número de aulas completadas
 * @returns Level ou null
 */
export async function getAppropriateLevel(completedClasses: number): Promise<any | null> {
  if (completedClasses === 0) {
    return null; // Sem nível ainda
  }

  // Busca o maior nível que o aluno atingiu
  // Exemplo: se tem 15 aulas e os níveis são 5, 10, 20
  // Retorna o nível de 10 aulas
  const level = await Level.findOne({
    where: {
      numberOfClasses: {
        [Op.lte]: completedClasses,
      },
    },
    order: [['numberOfClasses', 'DESC']], // Pega o maior possível
  });

  return level;
}

/**
 * Atualiza o nível do aluno baseado nas aulas completadas
 * @param studentId - ID do aluno
 * @returns Informações sobre a atualização
 */
export async function updateStudentLevel(studentId: number): Promise<{
  success: boolean;
  updated: boolean;
  previousLevel: number | null;
  newLevel: number | null;
  levelName?: string;
  completedClasses: number;
  message?: string;
}> {
  try {
    // 1. Buscar o aluno
    const student = await Person.findByPk(studentId);
    if (!student) {
      return {
        success: false,
        updated: false,
        previousLevel: null,
        newLevel: null,
        completedClasses: 0,
        message: 'Aluno não encontrado',
      };
    }

    // 2. Contar aulas completadas (passadas)
    const completedClasses = await countCompletedClasses(studentId);

    // 3. Determinar o nível apropriado
    const appropriateLevel = await getAppropriateLevel(completedClasses);

    const previousLevel = student.student_level ? parseInt(student.student_level) : null;
    const newLevelId = appropriateLevel?.id || null;

    // 4. Verificar se precisa atualizar
    if (previousLevel === newLevelId) {
      return {
        success: true,
        updated: false,
        previousLevel,
        newLevel: newLevelId,
        completedClasses,
        message: 'Nível já está correto',
      };
    }

    // 5. Atualizar o nível do aluno
    await student.update({
      student_level: newLevelId ? String(newLevelId) : null,
    });

    console.log(`✅ Nível do aluno ${studentId} atualizado: ${previousLevel} → ${newLevelId} (${completedClasses} aulas)`);

    return {
      success: true,
      updated: true,
      previousLevel,
      newLevel: newLevelId,
      levelName: appropriateLevel?.name,
      completedClasses,
      message: `Nível atualizado para: ${appropriateLevel?.name || 'Sem nível'}`,
    };
  } catch (error) {
    console.error('Erro ao atualizar nível do aluno:', error);
    return {
      success: false,
      updated: false,
      previousLevel: null,
      newLevel: null,
      completedClasses: 0,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Atualiza níveis de múltiplos alunos
 */
export async function updateMultipleStudentLevels(studentIds: number[]): Promise<{
  total: number;
  updated: number;
  errors: number;
}> {
  let updated = 0;
  let errors = 0;

  for (const studentId of studentIds) {
    try {
      const result = await updateStudentLevel(studentId);
      if (result.updated) {
        updated++;
      }
      if (!result.success) {
        errors++;
      }
    } catch (error) {
      console.error(`Erro ao atualizar nível do aluno ${studentId}:`, error);
      errors++;
    }
  }

  return {
    total: studentIds.length,
    updated,
    errors,
  };
}