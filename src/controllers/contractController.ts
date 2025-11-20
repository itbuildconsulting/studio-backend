// src/controllers/contractController.ts
import { Request, Response } from 'express';
import ContractSignature from '../models/ContractSignature';
import ContractVersion from '../models/ContractVersion';
import Person from '../models/Person.model';

/**
 * Buscar versão ativa do contrato
 */
export const getActiveContract = async (req: Request, res: Response): Promise<Response> => {
  try {
    const contract = await ContractVersion.findOne({
      where: { active: true },
      order: [['effective_date', 'DESC']],
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum contrato ativo encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error: any) {
    console.error('Erro ao buscar contrato ativo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contrato',
      error: error?.message,
    });
  }
};

/**
 * Assinar contrato
 */
export const signContract = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;
    const {
      contractVersionId,
      acceptedTerms,
      acceptedPrivacy,
      acceptedImageUse,
      acceptedDataProcessing,
    } = req.body;

    // Validar se o aluno existe
    const student = await Person.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado',
      });
    }

    // Validar se o contrato existe
    const contract = await ContractVersion.findByPk(contractVersionId);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Versão do contrato não encontrada',
      });
    }

    // Verificar se já assinou esta versão
    const existingSignature = await ContractSignature.findOne({
      where: {
        studentId,
        contractVersionId,
        active: true,
      },
    });

    if (existingSignature) {
      return res.status(400).json({
        success: false,
        message: 'Contrato já foi assinado',
        data: existingSignature,
      });
    }

    // Validar aceitações obrigatórias
    if (!acceptedTerms || !acceptedPrivacy || !acceptedDataProcessing) {
      return res.status(400).json({
        success: false,
        message: 'Você deve aceitar todos os termos obrigatórios',
        required: {
          acceptedTerms: true,
          acceptedPrivacy: true,
          acceptedDataProcessing: true,
          acceptedImageUse: false, // Opcional
        },
      });
    }

    // Capturar informações do dispositivo
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Criar snapshot dos dados do aluno
    const signature = await ContractSignature.create({
      studentId: Number(studentId),
      contractVersionId,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
      studentName: student.name,
      studentCpf: student.identity || '',
      studentEmail: student.email,
      studentBirthDate: student.birthday || null,
      acceptedTerms: acceptedTerms || true,
      acceptedPrivacy: acceptedPrivacy || true,
      acceptedImageUse: acceptedImageUse || false,
      acceptedDataProcessing: acceptedDataProcessing || true,
    });

    return res.status(201).json({
      success: true,
      message: 'Contrato assinado com sucesso',
      data: signature,
    });
  } catch (error: any) {
    console.error('Erro ao assinar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao assinar contrato',
      error: error?.message,
    });
  }
};

/**
 * Verificar se o aluno assinou o contrato
 */
export const checkContractStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;

    // Buscar contrato ativo
    const activeContract = await ContractVersion.findOne({
      where: { active: true },
      order: [['effective_date', 'DESC']],
    });

    if (!activeContract) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum contrato ativo encontrado',
      });
    }

    // Verificar se o aluno assinou
    const signature = await ContractSignature.findOne({
      where: {
        studentId,
        contractVersionId: activeContract.id,
        active: true,
      },
      order: [['signed_at', 'DESC']],
    });

    if (!signature) {
      return res.status(200).json({
        success: true,
        hasSigned: false,
        needsSignature: true,
        contract: activeContract,
        message: 'Aluno precisa assinar o contrato',
      });
    }

    return res.status(200).json({
      success: true,
      hasSigned: true,
      needsSignature: false,
      signature: signature,
      message: 'Contrato já foi assinado',
    });
  } catch (error: any) {
    console.error('Erro ao verificar status do contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do contrato',
      error: error?.message,
    });
  }
};

/**
 * Buscar assinatura do aluno
 */
export const getStudentSignature = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;

    const signature = await ContractSignature.findOne({
      where: {
        studentId,
        active: true,
      },
      include: [
        {
          model: ContractVersion,
          as: 'contractVersion',
        },
      ],
      order: [['signed_at', 'DESC']],
    });

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma assinatura encontrada',
        needsSignature: true,
      });
    }

    return res.status(200).json({
      success: true,
      data: signature,
    });
  } catch (error: any) {
    console.error('Erro ao buscar assinatura:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar assinatura',
      error: error?.message,
    });
  }
};

/**
 * Listar alunos sem contrato assinado
 */
export const getStudentsWithoutContract = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Buscar contrato ativo
    const activeContract = await ContractVersion.findOne({
      where: { active: true },
      order: [['effective_date', 'DESC']],
    });

    if (!activeContract) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum contrato ativo encontrado',
      });
    }

    // Buscar todos os alunos
    const students = await Person.findAll({
      where: { employee: false },
      attributes: ['id', 'name', 'email', 'identity'],
    });

    const studentsWithoutContract = [];

    for (const student of students) {
      const signature = await ContractSignature.findOne({
        where: {
          studentId: student.id,
          contractVersionId: activeContract.id,
          active: true,
        },
      });

      if (!signature) {
        studentsWithoutContract.push({
          id: student.id,
          name: student.name,
          email: student.email,
          cpf: student.identity,
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: studentsWithoutContract.length,
      data: studentsWithoutContract,
    });
  } catch (error: any) {
    console.error('Erro ao listar alunos sem contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar alunos sem contrato',
      error: error?.message,
    });
  }
};