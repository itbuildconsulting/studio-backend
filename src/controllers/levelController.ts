import { Request, Response } from 'express';
import Level from '../models/Level.model';

// Criar um novo nível
export const createLevel = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, numberOfClasses, title, benefit, color, antecedence } = req.body;

    // Verificar se já existe um nível com o mesmo numberOfClasses
    const existingLevelByClasses = await Level.findOne({
      where: { numberOfClasses },
    });

    // Verificar se já existe um nível com a mesma cor
    const existingLevelByColor = await Level.findOne({
      where: { color },
    });

    // Se existir um nível com o mesmo número de aulas ou cor, retornamos um erro
    if (existingLevelByClasses) {
      return res.status(400).json({
        success: false,
        message: `Já existe um nível com ${numberOfClasses} aulas.`,
      });
    }

    if (existingLevelByColor) {
      return res.status(400).json({
        success: false,
        message: `Já existe um nível com a cor ${color}.`,
      });
    }

    // Se não houver duplicação, cria o novo nível
    const newLevel = await Level.create({
      name,
      numberOfClasses,
      title,
      benefit,
      color,
      antecedence,
    });

    return res.status(201).json({
      success: true,
      message: 'Nível criado com sucesso',
      data: newLevel,
    });
  } catch (error) {
    console.error('Erro ao criar nível:', error);
    return res.status(500).json({ success: false, error: 'Erro ao criar nível' });
  }
};

// Editar um nível existente
export const updateLevel = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, numberOfClasses, title, benefit, color } = req.body;

    const level = await Level.findByPk(id);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Nível não encontrado' });
    }

    level.name = name || level.name;
    level.numberOfClasses = numberOfClasses || level.numberOfClasses;
    level.title = title || level.title;
    level.benefit = benefit || level.benefit;
    level.color = color || level.color;

    await level.save();

    return res.status(200).json({
      success: true,
      message: 'Nível atualizado com sucesso',
      data: level,
    });
  } catch (error) {
    console.error('Erro ao atualizar nível:', error);
    return res.status(500).json({ success: false, error: 'Erro ao atualizar nível' });
  }
};

// Deletar um nível
export const deleteLevel = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const level = await Level.findByPk(id);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Nível não encontrado' });
    }

    await level.destroy();

    return res.status(200).json({ success: true, message: 'Nível excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir nível:', error);
    return res.status(500).json({ success: false, error: 'Erro ao excluir nível' });
  }
};

// Listar todos os níveis
export const getAllLevels = async (req: Request, res: Response): Promise<Response> => {
  try {
    const levels = await Level.findAll();
    return res.status(200).json({ success: true, data: levels });
  } catch (error) {
    console.error('Erro ao listar níveis:', error);
    return res.status(500).json({ success: false, error: 'Erro ao listar níveis' });
  }
};
