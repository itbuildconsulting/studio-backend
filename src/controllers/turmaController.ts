import { Request, Response } from 'express';
import Turma from '../models/Turma.model';
import TurmaSlot from '../models/TurmaSlot.model';
import Class from '../models/Class.model';
import Person from '../models/Person.model';
import ProductType from '../models/ProductType.model';
import { generateClassesForTurma } from '../services/turmaService';

// LIST
export const getAllTurmas = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { active } = req.query;

    const where: any = {};
    if (active !== undefined) where.active = active === 'true';

    const turmas = await Turma.findAll({
      where,
      include: [{ model: TurmaSlot, as: 'slots' }],
      order: [['name', 'ASC']],
    });

    const enriched = await Promise.all(
      turmas.map(async (turma) => {
        const [teacher, productType] = await Promise.all([
          Person.findByPk(turma.teacherId, { attributes: ['id', 'name'] }),
          ProductType.findByPk(turma.productTypeId, { attributes: ['id', 'name'] }),
        ]);
        return {
          ...turma.toJSON(),
          teacher: teacher?.name ?? null,
          productTypeName: productType?.name ?? null,
        };
      })
    );

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('[Turma] Erro ao listar turmas:', error);
    return res.status(500).json({ success: false, error: 'Erro ao listar turmas' });
  }
};

// GET BY ID
export const getTurmaById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const turma = await Turma.findByPk(req.params.id, {
      include: [{ model: TurmaSlot, as: 'slots' }],
    });

    if (!turma) return res.status(404).json({ success: false, message: 'Turma não encontrada' });

    const [teacher, productType] = await Promise.all([
      Person.findByPk(turma.teacherId, { attributes: ['id', 'name'] }),
      ProductType.findByPk(turma.productTypeId, { attributes: ['id', 'name'] }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...turma.toJSON(),
        teacher: teacher?.name ?? null,
        productTypeName: productType?.name ?? null,
      },
    });
  } catch (error) {
    console.error('[Turma] Erro ao buscar turma:', error);
    return res.status(500).json({ success: false, error: 'Erro ao buscar turma' });
  }
};

// CREATE
export const createTurma = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, teacherId, productTypeId, limit, active = true, slots } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Nome é obrigatório.' });
    if (!teacherId) return res.status(400).json({ success: false, message: 'Professor é obrigatório.' });
    if (!productTypeId) return res.status(400).json({ success: false, message: 'Tipo de produto é obrigatório.' });
    if (!limit || limit <= 0) return res.status(400).json({ success: false, message: 'Limite de alunos é obrigatório.' });
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ success: false, message: 'Pelo menos um horário é obrigatório.' });
    }

    const turma = await Turma.create({ name, teacherId, productTypeId, limit, active });

    const createdSlots = await Promise.all(
      slots.map((s: any) =>
        TurmaSlot.create({
          turmaId: turma.id,
          diaSemana: s.diaSemana,
          horarioInicio: s.horarioInicio,
          horarioFim: s.horarioFim,
        })
      )
    );

    return res.status(201).json({ success: true, data: { ...turma.toJSON(), slots: createdSlots } });
  } catch (error) {
    console.error('[Turma] Erro ao criar turma:', error);
    return res.status(500).json({ success: false, error: 'Erro ao criar turma' });
  }
};

// UPDATE
export const updateTurma = async (req: Request, res: Response): Promise<Response> => {
  try {
    const turma = await Turma.findByPk(req.params.id);
    if (!turma) return res.status(404).json({ success: false, message: 'Turma não encontrada' });

    const { name, teacherId, productTypeId, limit, active, slots } = req.body;

    await turma.update({
      name: name ?? turma.name,
      teacherId: teacherId ?? turma.teacherId,
      productTypeId: productTypeId ?? turma.productTypeId,
      limit: limit ?? turma.limit,
      active: active !== undefined ? active : turma.active,
    });

    if (slots && Array.isArray(slots)) {
      await TurmaSlot.destroy({ where: { turmaId: turma.id } });
      await Promise.all(
        slots.map((s: any) =>
          TurmaSlot.create({
            turmaId: turma.id,
            diaSemana: s.diaSemana,
            horarioInicio: s.horarioInicio,
            horarioFim: s.horarioFim,
          })
        )
      );
    }

    const updated = await Turma.findByPk(turma.id, {
      include: [{ model: TurmaSlot, as: 'slots' }],
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('[Turma] Erro ao atualizar turma:', error);
    return res.status(500).json({ success: false, error: 'Erro ao atualizar turma' });
  }
};

// DELETE
export const deleteTurma = async (req: Request, res: Response): Promise<Response> => {
  try {
    const turma = await Turma.findByPk(req.params.id);
    if (!turma) return res.status(404).json({ success: false, message: 'Turma não encontrada' });

    // Desvincula aulas futuras antes de excluir
    await Class.update({ turmaId: null }, { where: { turmaId: turma.id } });
    await TurmaSlot.destroy({ where: { turmaId: turma.id } });
    await turma.destroy();

    return res.status(200).json({ success: true, message: 'Turma excluída com sucesso' });
  } catch (error) {
    console.error('[Turma] Erro ao excluir turma:', error);
    return res.status(500).json({ success: false, error: 'Erro ao excluir turma' });
  }
};

// GENERATE CLASSES MANUALLY
export const gerarAulasTurma = async (req: Request, res: Response): Promise<Response> => {
  try {
    const turma = await Turma.findByPk(req.params.id, {
      include: [{ model: TurmaSlot, as: 'slots' }],
    });

    if (!turma) return res.status(404).json({ success: false, message: 'Turma não encontrada' });
    if (!turma.active) return res.status(400).json({ success: false, message: 'Turma inativa' });

    const slots = (turma as any).slots as TurmaSlot[];
    if (!slots || slots.length === 0) {
      return res.status(400).json({ success: false, message: 'Turma sem horários cadastrados' });
    }

    const created = await generateClassesForTurma(turma, slots);

    return res.status(200).json({
      success: true,
      message: `${created} aula(s) gerada(s) com sucesso`,
      created,
    });
  } catch (error) {
    console.error('[Turma] Erro ao gerar aulas:', error);
    return res.status(500).json({ success: false, error: 'Erro ao gerar aulas' });
  }
};
