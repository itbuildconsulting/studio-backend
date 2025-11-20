// src/controllers/parqController.ts
import { Request, Response } from 'express';
import Person from '../models/Person.model';
import ParQ from '../models/ParQ.model';

/**
 * Criar ou atualizar PAR-Q de um aluno
 */
export const saveParQ = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;
    const {
      question1,
      question2,
      question3,
      question4,
      question5,
      question6,
      question7,
      signedTerm,
    } = req.body;

    // Validar se o aluno existe
    const student = await Person.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado',
      });
    }

    // Verificar se há risco
    const hasRisk =
      question1 || question2 || question3 || question4 || question5 || question6 || question7;

    // Se há risco e não assinou termo, retornar erro
    if (hasRisk && !signedTerm) {
      return res.status(400).json({
        success: false,
        message: 'É necessário assinar o termo de responsabilidade',
        requiresTerm: true,
      });
    }

    // Buscar PAR-Q existente
    let parq = await ParQ.findOne({ where: { studentId } });

    if (parq) {
      // Atualizar existente
      await parq.update({
        question1,
        question2,
        question3,
        question4,
        question5,
        question6,
        question7,
        signedTerm: hasRisk ? signedTerm : false,
        termDate: hasRisk && signedTerm ? new Date() : null,
      });
    } else {
      // Criar novo
      parq = await ParQ.create({
        studentId: Number(studentId),
        question1,
        question2,
        question3,
        question4,
        question5,
        question6,
        question7,
        signedTerm: hasRisk ? signedTerm : false,
        termDate: hasRisk && signedTerm ? new Date() : null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'PAR-Q salvo com sucesso',
      data: parq,
      hasRisk,
    });
  } catch (error: any) {
    console.error('Erro ao salvar PAR-Q:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao salvar PAR-Q',
      error: error?.message,
    });
  }
};

/**
 * Buscar PAR-Q de um aluno
 */
export const getParQ = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;

    const parq = await ParQ.findOne({ where: { studentId } });

    if (!parq) {
      return res.status(404).json({
        success: false,
        message: 'PAR-Q não encontrado. Aluno precisa preencher o questionário.',
        needsParQ: true,
      });
    }

    return res.status(200).json({
      success: true,
      data: parq,
      hasRisk: parq.hasRisk,
    });
  } catch (error: any) {
    console.error('Erro ao buscar PAR-Q:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar PAR-Q',
      error: error?.message,
    });
  }
};

/**
 * Verificar se o aluno pode agendar aulas
 * (Precisa ter preenchido o PAR-Q)
 */
export const checkParQStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;

    const parq = await ParQ.findOne({ where: { studentId } });

    if (!parq) {
      return res.status(200).json({
        success: true,
        canBook: false,
        needsParQ: true,
        message: 'É necessário preencher o Questionário de Prontidão para Atividade Física (PAR-Q)',
      });
    }

    // Se tem risco e não assinou termo
    if (parq.hasRisk && !parq.signedTerm) {
      return res.status(200).json({
        success: true,
        canBook: false,
        needsTerm: true,
        message: 'É necessário assinar o termo de responsabilidade',
      });
    }

    // Tudo ok
    return res.status(200).json({
      success: true,
      canBook: true,
      hasRisk: parq.hasRisk,
      message: 'Aluno pode agendar aulas',
    });
  } catch (error: any) {
    console.error('Erro ao verificar status PAR-Q:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar status PAR-Q',
      error: error?.message,
    });
  }
};

/**
 * Listar alunos que ainda não preencheram o PAR-Q
 */
export const getStudentsWithoutParQ = async (req: Request, res: Response): Promise<Response> => {
  try {
    const students = await Person.findAll({
      where: { employee: false },
      attributes: ['id', 'name', 'email'],
    });

    const studentsWithoutParQ = [];

    for (const student of students) {
      const parq = await ParQ.findOne({ where: { studentId: student.id } });
      if (!parq) {
        studentsWithoutParQ.push({
          id: student.id,
          name: student.name,
          email: student.email,
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: studentsWithoutParQ.length,
      data: studentsWithoutParQ,
    });
  } catch (error: any) {
    console.error('Erro ao listar alunos sem PAR-Q:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar alunos sem PAR-Q',
      error: error?.message,
    });
  }
};