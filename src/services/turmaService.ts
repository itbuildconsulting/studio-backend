import { addDays, format, getDay } from 'date-fns';
import { Op } from 'sequelize';
import Class from '../models/Class.model';
import Turma from '../models/Turma.model';
import TurmaSlot from '../models/TurmaSlot.model';

const WEEKS_AHEAD = parseInt(process.env.TURMA_WEEKS_AHEAD || '2', 10);

export async function generateClassesForTurma(turma: Turma, slots: TurmaSlot[]): Promise<number> {
  const today = new Date();
  const endDate = addDays(today, WEEKS_AHEAD * 7);
  let created = 0;

  for (let d = new Date(today); d <= endDate; d = addDays(d, 1)) {
    const dayOfWeek = getDay(d);
    const dateStr = format(d, 'yyyy-MM-dd');

    for (const slot of slots) {
      if (slot.diaSemana !== dayOfWeek) continue;

      const existing = await Class.findOne({
        where: { turmaId: turma.id, date: dateStr, time: { [Op.like]: `${slot.horarioInicio}%` } },
      });

      if (existing) continue;

      await Class.create({
        turmaId: turma.id,
        date: dateStr,
        time: slot.horarioInicio,
        teacherId: turma.teacherId,
        productTypeId: turma.productTypeId,
        limit: turma.limit,
        hasCommission: false,
        active: true,
      });

      created++;
    }
  }

  return created;
}

export async function generateClassesForAllActiveTurmas(): Promise<{
  total: number;
  created: number;
  errors: number;
}> {
  const turmas = await Turma.findAll({
    where: { active: true },
    include: [{ model: TurmaSlot, as: 'slots' }],
  });

  let total = 0;
  let created = 0;
  let errors = 0;

  for (const turma of turmas) {
    total++;
    try {
      const slots = (turma as any).slots as TurmaSlot[];
      if (!slots || slots.length === 0) continue;

      const n = await generateClassesForTurma(turma, slots);
      created += n;
    } catch (e) {
      console.error(`[TurmaService] Erro ao gerar aulas para turma ${turma.id}:`, e);
      errors++;
    }
  }

  return { total, created, errors };
}
