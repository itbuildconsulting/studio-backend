import { Request, Response } from 'express';
import Balance from '../models/Balance.model';
import { authenticateToken } from '../core/token/authenticateToken';
import { Op } from 'sequelize';
import { format } from 'date-fns';
import Class from '../models/Class.model';
import Person from '../models/Person.model';
import ClassStudent from '../models/ClassStudent.model';
import Bike from '../models/Bike.model';
import sequelize from '../config/database';
import Transactions from '../models/Transaction.model'; // Importando o modelo de transações
import Level from '../models/Level.model';
import Credit from '../models/Credit.model';
import Config from '../models/Config.model';
import Product from '../models/Product.model';
import ProductType from '../models/ProductType.model';
import Place from '../models/Place.model';
import { getProductById } from './productController';
import WaitingList from '../models/WaitingList.model';
import { sendPushToPersons } from '../services/pushService';
import Item from '../models/Item.model';

import { checkProductUsageRestriction, getStudentProductByType } from '../services/productUsageRestriction';

/*export const balance = async (req: Request, res: Response): Promise<Response | void> => {
    const personId = req.body.user?.id;    

    try {
        return authenticateToken(req, res, async () => {
            if (!personId) {
                return res.status(401).json({ message: 'Token inválido' });
            }

            try {
                // Buscar todos os créditos válidos do usuário
                const credits = await Credit.findAll({
                    where: {
                        idCustomer: personId,
                        status: 'valid', // Considera apenas os créditos válidos
                        expirationDate: {
                            [Op.gte]: new Date() // Apenas créditos que não expiraram
                        }
                    }
                });

                // Calcular o total de créditos disponíveis
                const availableCredits = credits.reduce((total, credit) => total + credit.availableCredits, 0);

                if (availableCredits === 0) {
                    return res.status(200).json({
                        success: true,
                        message: 'Nenhum crédito disponível ou todos expiraram.',
                        balance: 0
                    });
                }

                return res.status(200).json({
                    success: true,
                    balance: availableCredits
                });
            } catch (error) {
                console.error('Erro ao validar token:', error);
                const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar saldo';
                return res.status(500).json({
                    success: false,
                    message: errorMessage
                });
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        return res.status(401).send('Token inválido');
    }
};*/

export const balance = async (req: Request, res: Response): Promise<Response> => {
  const personId = req.body.user?.id;  
  if (!personId) return res.status(401).json({ message: 'Token inválido' });

  try {
    const config = await Config.findOne({ where: { configKey: 'app_product' } });

    const allowedProductTypes =
      (config?.configValue || '')
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => Number.isFinite(n));

    // DATEONLY: compare com string YYYY-MM-DD para incluir o "hoje"
    const today = format(new Date(), 'yyyy-MM-dd');

    const where: any = {
      idCustomer: personId,         // confira o nome da coluna
      status: 'valid',              // confira o valor real salvo
      expirationDate: { [Op.gte]: today },
    };

    const include: any[] = [];
    if (allowedProductTypes.length > 0) {
      include.push({
        model: Product,
        attributes: [], // não precisamos dos campos
        where: { productTypeId: { [Op.in]: allowedProductTypes } },
        required: true, // vira INNER JOIN (filtra mesmo)
      });
    }

    // se preferir fazer em SQL direto:
    // const availableCredits = await Credit.sum('availableCredits', { where, include });

    const credits = await Credit.findAll({ where, include, attributes: ['availableCredits'] });

    const availableCredits = credits.reduce(
      (sum, c: any) => sum + (c.availableCredits ?? 0),
      0
    );

    return res.status(200).json({
      success: true,
      balance: availableCredits,
      message: availableCredits === 0 ? 'Nenhum crédito disponível ou todos expiraram.' : undefined,
    });
  } catch (error) {
    console.error('Erro ao verificar saldo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao verificar saldo',
    });
  }
};

  export const schedule = async (req: Request, res: Response): Promise<Response> => {
  try {
    
    const { studentId, month, year } = req.body;
    
    const student = await Person.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Estudante não encontrado' });
    }
    
    const studentLevel = await Level.findOne({ where: { id: student.student_level } });
    const antecedence = studentLevel ? Number(studentLevel.antecedence) || 7 : 7;
    
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + antecedence);

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    
    // Buscar config de produtos permitidos no app
    const config = await Config.findOne({ where: { configKey: 'app_product' } });
    let allowedProductTypes: number[] = [];
    if (config?.configValue) {
      allowedProductTypes = config.configValue
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter(Boolean);
    }
    
    const whereCondition: any = {
      date: { [Op.gte]: formattedStartDate, [Op.lte]: formattedEndDate },
      active: true,
    };
    if (allowedProductTypes.length > 0) {
      whereCondition.productTypeId = { [Op.in]: allowedProductTypes };
    }
    
    const availableClasses = await Class.findAll({
      attributes: ['date'],
      where: whereCondition,
      group: ['date'],
      order: [['date', 'ASC']],
    });

    if (!availableClasses.length) {
      return res.status(404).json({ message: 'Nenhuma aula disponível para o período' });
    }

    const availableDays = [...new Set(availableClasses.map((c) => c.date))];
    
    const response = { success: true, availableDays };
    
    return res.status(200).json(response);
  } catch (error) {
    
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ success: false, message: errorMessage });
  }
};

export const hours = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'A data é obrigatória' });
        }

        const availableClasses = await Class.findAll({
            attributes: ['id', 'time', 'title', 'teacherId'],
            where: { date, active: true },
            order: [['time', 'ASC']]
        });

        if (!availableClasses.length) {
            return res.status(404).json({ message: 'Nenhum horário disponível para esta data' });
        }

        const availableTimes = await Promise.all(availableClasses.map(async classData => {
            const teacher = await Person.findByPk(classData.teacherId, { attributes: ['name'] });
            return {
                id: classData.id,
                time: classData.time,
                title: classData.title ?? null,
                teacherName: teacher?.name ?? null,
            };
        }));

        return res.status(200).json({
            success: true,
            availableTimes
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);

        const errorMessage = error instanceof Error ? error.message : 'Token inválido';

        return res.status(401).json({
            success: false,
            message: errorMessage
        });
    }
};

export const getClassById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'O ID da aula é obrigatório' });
        }

        const classData = await Class.findByPk(id, {
            attributes: ['id', 'date', 'time', 'teacherId', 'productTypeId', 'title', 'description']
        });

        if (!classData) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

        const teacher = classData.teacherId 
            ? await Person.findByPk(classData.teacherId, { attributes: ['name'] }) 
            : null;

        const bikes = await Bike.findAll({
            where: { classId: id },
            attributes: ['id', 'bikeNumber', 'status', 'studentId'],
        });

        return res.status(200).json({
            success: true,
            class: {
                id: classData.id,
                date: classData.date,
                time: classData.time,
                title: classData.title ?? null,
                description: classData.description ?? null,
                getProductById: classData.productTypeId,
                teacherId: classData.teacherId || '',
                teacherName: teacher ? teacher.name : '',
                bikes: bikes.map(bike => ({
                    id: bike.id,           // ← adicionar
                    bikeNumber: bike.bikeNumber,
                    status: bike.status,
                    studentId: bike.studentId, // ← adicionar
                }))
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);

        const errorMessage = error instanceof Error ? error.message : 'Token inválido';

        return res.status(401).json({
            success: false,
            message: errorMessage
        });
    }
};

export const getClassWithSingleStudent = async (req: Request, res: Response): Promise<Response> => {
  try {
       const { classId, studentId } = req.body;

        if (!classId || !studentId) {
            return res.status(400).json({ success: false, message: "classId e studentId são obrigatórios." });
        }

        const classData = await Class.findByPk(classId, {
            attributes: ['id', 'date', 'time', 'teacherId']
        });

        if (!classData) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

        const teacher = classData.teacherId 
            ? await Person.findByPk(classData.teacherId, { attributes: ['name'] }) 
            : null;

        // >>> VÍNCULO DO ALUNO NA AULA (queremos o ID do ClassStudent)
        // Se na sua tabela a coluna for PersonId, troque `studentId` por `PersonId` aqui.
        const enrollment = await ClassStudent.findOne({
        where: { classId, studentId },
        attributes: ['id', 'classId', 'studentId', 'checkin'] // precisamos do id
        });

        const  studentBike = await Bike.findOne({
            where: { classId: classId, studentId },
            attributes: ["id", "bikeNumber" , "status"], // <- mesmo ajuste aqui
        });
        

        return res.status(200).json({
            success: true,
            class: {
                id: classData.id,
                date: classData.date,
                time: classData.time,
                teacherId: classData.teacherId || '',
                teacherName: teacher ? teacher.name : '',
                classStudentId: enrollment ? enrollment.id : null,
                checkin: enrollment ? enrollment.checkin : null,
                bikes: [studentBike]
            }
        });
    } catch (error) {
        console.error("Erro ao buscar aula/aluno:", error);
        return res.status(500).json({ success: false, message: "Erro ao buscar aula/aluno." });
  }
}



export const addStudentToClassWithBikeNumber = async (req: Request, res: Response): Promise<Response> => {
  const { classId, studentId, bikeNumber, productTypeId: productTypeIdFromBody } = req.body;

  try {
    // 1) Verificar se a aula existe
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Aula não encontrada' });
    }

    // 2) Descobrir o productTypeId exigido para essa aula
    const productTypeId = classData.productTypeId ?? productTypeIdFromBody;
    if (!productTypeId) {
      return res.status(400).json({ message: 'productTypeId da aula não definido.' });
    }

    // 3) Verificar se o aluno já está inscrito (checagem rápida fora da tx)
    const existingEnrollment = await ClassStudent.findOne({ where: { classId, studentId, status: 1 } });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Aluno já está inscrito nesta aula' });
    }

    // 4) Verificar se a bike está disponível (checagem rápida)
    const existingBike = await Bike.findOne({ where: { classId, bikeNumber } });
    if (existingBike && existingBike.status !== 'available') {
      return res.status(400).json({ message: 'Bike não está disponível' });
    }

    // 5) ⭐ NOVA VALIDAÇÃO: Verificar restrição de uso do produto
    const product = await getStudentProductByType(studentId, productTypeId);
    
    // ⬇️ DECLARE restrictionCheck AQUI FORA para ser acessível depois
    let restrictionCheck: any = null;
    
    if (product) {
      restrictionCheck = await checkProductUsageRestriction(
        studentId,
        product.id,
        classData.date
      );

      if (!restrictionCheck.canUse) {
        return res.status(400).json({
          success: false,
          message: restrictionCheck.message,
          restriction: {
            type: product.usageRestrictionType,
            limit: restrictionCheck.limit,
            currentUsage: restrictionCheck.currentUsage,
            periodStart: restrictionCheck.periodStart,
            periodEnd: restrictionCheck.periodEnd,
          },
        });
      }
    }

    // ---------- Transação para garantir atomicidade ----------
    const t = await sequelize.transaction();
    try {
      const now = new Date();

      // (Re)verificações sob lock para evitar corrida
      const alreadyEnrolled = await ClassStudent.findOne({
        where: { classId, studentId, status: 1 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (alreadyEnrolled) {
        await t.rollback();
        return res.status(400).json({ message: 'Aluno já está inscrito nesta aula' });
      }

      // FEFO: pegar o LOTE mais antigo, válido e com saldo, do TIPO correto
      const creditLot = await Credit.findOne({
        where: {
          idCustomer: studentId,
          productTypeId,
          status: 'valid',
          expirationDate: { [Op.gte]: now },
          availableCredits: { [Op.gt]: 0 },
        },
        order: [
          ['expirationDate', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!creditLot) {
        await t.rollback();
        return res.status(400).json({ 
          message: 'Créditos insuficientes para esse tipo de aula (ou todos vencidos).' 
        });
      }

      // Criar/atribuir a bike dentro da tx
      const bike = existingBike
        ? existingBike
        : await Bike.create(
            { classId, studentId, bikeNumber, status: 'in_use' },
            { transaction: t }
          );

      if (existingBike) {
        await existingBike.update(
          { studentId, status: 'in_use' },
          { transaction: t }
        );
      }

      // Criar vínculo do aluno com a aula
      await ClassStudent.create(
        {
          classId,
          PersonId: studentId,
          studentId,
          bikeId: bike.id,
          transactionId: creditLot.creditBatch,
          status: 1
        },
        { transaction: t }
      );

      // Consumir 1 crédito do LOTE FEFO
      creditLot.availableCredits -= 1;
      creditLot.usedCredits += 1;
      if (creditLot.availableCredits === 0) creditLot.status = 'used';
      await creditLot.save({ transaction: t });

      await t.commit();
      
      // ⬇️ AGORA restrictionCheck está acessível aqui
      return res.status(200).json({
        success: true,
        message: 'Aluno adicionado à aula, bike atribuída e 1 crédito consumido (FEFO).',
        usageInfo: product ? {
          productName: product.name,
          restrictionType: product.usageRestrictionType,
          usageLimit: product.usageRestrictionLimit,
          currentUsage: restrictionCheck?.currentUsage || 0,
        } : null,
      });
      
    } catch (err) {
      await t.rollback();
      console.error('Erro durante a transação:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro durante a operação',
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  } catch (error) {
    console.error('Erro ao adicionar aluno à aula:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar aluno à aula',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};


export const cancelStudentPresenceInClass = async (req: Request, res: Response): Promise<Response> => {
  const { classId, studentId, bikeId } = req.body;

  const t = await sequelize.transaction();
  try {
    if (!classId || !studentId || !bikeId) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'classId, studentId e bikeId são obrigatórios.' });
    }

    // 1) Aula (lock)
    const classData = await Class.findByPk(classId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!classData) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Aula não encontrada.' });
    }

    // 2) Janela de cancelamento: até 2h antes
    const classDateStr = String((classData as any).date); // 'YYYY-MM-DD'
    const classTimeStr = String((classData as any).time); // 'HH:mm:ss'
    const classDateTime = new Date(`${classDateStr}T${classTimeStr}-03:00`);
    const now = new Date();
    const twoHoursBefore = new Date(classDateTime);
    twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);

    /*if (now >= twoHoursBefore) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'O cancelamento só é permitido até 2 horas antes da aula.',
      });
    }*/

    // 3) Vínculo ATIVO — bate studentId + bikeId + status ativo
    const classStudent = await ClassStudent.findOne({
        where: { classId, studentId, bikeId, status: 1 }, // ✅ match preciso
        transaction: t,
        lock: t.LOCK.UPDATE,
    });
    if (!classStudent) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Inscrição ativa não encontrada.' });
    }

    // 4) Soltar a bike (se houver)
    const bike = await Bike.findOne({ where: { classId, studentId }, transaction: t, lock: t.LOCK.UPDATE });
    if (bike) {
      await bike.destroy({ transaction: t });
    }

    // 5) Tentar reembolsar 1 crédito se houve consumo (transactionId no vínculo)
    const creditBatch = (classStudent as any).transactionId;
    let refundMessage = 'Nenhum crédito para devolver.';
    let refundData: any = null;

    if (creditBatch) {
      const productTypeId = (classData as any).productTypeId;
      const lotWhere: any = { idCustomer: studentId, creditBatch };
      if (productTypeId) lotWhere.productTypeId = productTypeId;

      const lot = await Credit.findOne({
        where: lotWhere,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!lot) {
        refundMessage = 'Lote de crédito original não encontrado; nenhum crédito devolvido.';
      } else if (lot.expirationDate && lot.expirationDate < now) {
        refundMessage = 'Lote expirado; nenhum crédito devolvido.';
      } else if ((lot.usedCredits ?? 0) <= 0) {
        refundMessage = 'Sem consumo registrado no lote; nenhum crédito devolvido.';
      } else {
        // ✅ Reverte 1 unidade
        lot.availableCredits += 1;
        lot.usedCredits -= 1;
        if (lot.status === 'used' && lot.availableCredits > 0) lot.status = 'valid';
        await lot.save({ transaction: t });

        refundMessage = '1 crédito devolvido ao lote de origem.';
        refundData = {
          creditLotId: lot.id,
          creditBatch: lot.creditBatch,
          availableCredits: lot.availableCredits,
          usedCredits: lot.usedCredits,
          status: lot.status,
        };
      }
    } else {
      refundMessage = 'Inscrição sem débito de crédito; nada a devolver.';
    }

    // 6) Marcar vínculo como cancelado e zerar checkin
    await classStudent.update({ status: 0, checkin: 0 }, { transaction: t });

    // Salva info da aula para compor a notificação depois do commit
    const notifyDate = classDateStr;
    const notifyTime = classTimeStr;
    const notifyClassId = Number(classId);

    await t.commit();

    // 7) 🔔 Após o commit: notificar quem está na fila dessa aula
    let notified = 0;
    try {
      const waiters = await WaitingList.findAll({
        where: { classId: notifyClassId },
        attributes: ['studentId'],
        raw: true,
      });

      // IDs únicos e sem o aluno que cancelou
      const personIds = Array.from(
        new Set(
          waiters
            .map(w => Number(w.studentId))
            .filter(id => Number.isFinite(id) && id !== Number(studentId))
        )
      );

      if (personIds.length > 0) {
        const title = 'Vaga liberada!';
        const timeHHmm = notifyTime?.slice(0, 5) ?? '';
        const body = `Abriu uma vaga na aula de ${notifyDate} às ${timeHHmm}. Garanta sua vaga agora.`;
        const data = {
          type: 'class_waitlist_spot',
          classId: notifyClassId,
          date: notifyDate,
          time: notifyTime,
          deeplink: `spingo://class/${notifyClassId}`,
        };

        // assinatura: (personIds, { title, body, data })
        const result = await sendPushToPersons(personIds, { title, body, data });


        // logs úteis
        console.log('[waitlist push]', {
          classId: notifyClassId,
          totalTokens: result.total
        });

        // se InvalidCredentials, você já mapeia 502 no /push/send; aqui só logamos
        if (result.success === false) {
          console.warn('[waitlist push] envio com falha:', result.error);
        }
      } else {
        console.log('[waitlist push] ninguém na fila para notificar.', { classId: notifyClassId });
      }
    } catch (pushErr) {
      console.error('[cancelStudentPresenceInClass] push notify error:', pushErr);
      // não falha a operação por causa do push
    }

    return res.status(200).json({
      success: true,
      message: `Presença cancelada. ${refundMessage}`,
      data: {
        classStudentId: classStudent.id,
        refund: refundData,
        notifiedWaitlistCount: notified,
      },
    });
  } catch (error: any) {
    await t.rollback();
    console.error('Erro ao cancelar presença do aluno:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar presença do aluno',
      error: error?.message ?? 'Erro desconhecido',
    });
  }
};

function pad(n: number) { return n.toString().padStart(2, '0'); }
function formatDateYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}
function formatTimeHHmmSS(d: Date) {
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${h}:${m}:${s}`; // compatível com TIME do MySQL/Postgres
}

export const nextClass = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;

    // validação básica
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'ID do aluno é obrigatório' });
    }

    // checa se o aluno existe
    const student = await Person.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
    }

    // busca as aulas associadas com status = 0
    const classStudentRecords = await ClassStudent.findAll({
      where: {
        studentId,
        status: 1, // 👈 só aulas com status 0
      },
      attributes: ['classId'],
    });

    const classIds = classStudentRecords.map(record => record.classId);

    if (!classIds.length) {
      return res
        .status(200)
        .json({ success: true, message: 'Nenhuma próxima aula encontrada', data: [] });
    }

    const now = new Date();
    const nextClasses = await Class.findAll({
      where: {
        id: classIds,
        date: {
          [Op.gte]: now,
        },
      },
      order: [['date', 'ASC'], ['time', 'ASC']],
      attributes: ['id', 'date', 'time'],
    });

    if (!nextClasses.length) {
      return res
        .status(200)
        .json({ success: true, message: 'Nenhuma próxima aula encontrada', data: [] });
    }

    return res.status(200).json({ success: true, data: nextClasses });
  } catch (error) {
    console.error('Erro ao listar próximas aulas:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Erro ao listar próximas aulas' });
  }
};

export const getStudentSummary = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { studentId } = req.params;

        // Validar se o ID do aluno foi fornecido
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'ID do aluno é obrigatório' });
        }

        // Buscar o aluno no banco de dados
        const student = await Person.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
        }

        const idCustomer = studentId;

        const config = await Config.findOne({ where: { configKey: 'app_product' } });

        const allowedProductTypes =
        (config?.configValue || '')
            .split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(n => Number.isFinite(n));

        // DATEONLY: compare com string YYYY-MM-DD para incluir o "hoje"
        const today = format(new Date(), 'yyyy-MM-dd');

        const include: any[] = [];
        if (allowedProductTypes.length > 0) {
        include.push({
            model: Product,
            attributes: [], // não precisamos dos campos
            where: { productTypeId: { [Op.in]: allowedProductTypes } },
            required: true, // vira INNER JOIN (filtra mesmo)
        });
        }

        const where: any = {
            idCustomer: studentId,         // confira o nome da coluna
            status: 'valid',              // confira o valor real salvo
            expirationDate: { [Op.gte]: today },
        };

        // Buscar o saldo do aluno na tabela balance
        const credits = await Credit.findAll({ where, include, attributes: ['availableCredits'] });

        const availableCredits = credits.reduce(
            (sum, c: any) => sum + (c.availableCredits ?? 0),
            0
        );
        

         // ✅ FIX BUG 3: buscar status + data da aula via join com Class
        const classStudentRecords = await ClassStudent.findAll({
            where: { studentId },
            attributes: ['classId', 'checkin', 'status'],
            include: [{
                model: Class,
                attributes: ['date'],
            }],
        });
  
        // ✅ Agendadas: ativa (status = true) + data futura ou hoje
        const scheduledClassesCount = classStudentRecords.filter((record: any) => {
            const classDate: string = record.Class?.date ?? '';
            return record.status === true && classDate >= today;
        }).length;
 
        // ✅ Realizadas: ativa (status = true) + data no passado (checkin opcional)
        const completedClassesCount = classStudentRecords.filter((record: any) => {
            const classDate: string = record.Class?.date ?? '';
            return record.status === true && classDate < today;
        }).length;


        // Resumo do aluno
        const summary = {
            studentId: student.id,
            name: student.name,
            credits: availableCredits,
            scheduledClasses: scheduledClassesCount,
            completedClasses: completedClassesCount,
        };

        return res.status(200).json({ success: true, data: summary });
    } catch (error) {
        console.error('Erro ao obter resumo do aluno:', error);
        return res.status(500).json({ success: false, message: 'Erro ao obter resumo do aluno' });
    }
};


export const getLatestClassesByStudent = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'ID do aluno é obrigatório' });
    }

    // pega as últimas aulas do aluno
    const latestClasses = await ClassStudent.findAll({
      where: { studentId },
      include: [
        {
          model: Class,
          attributes: ['id', 'date', 'time', 'productTypeId'],
        },
      ],
      order: [
        [Class, 'date', 'DESC'],
        [Class, 'time', 'DESC'],
      ],
      limit: 10,
    });

    // mapeia e busca o número da bike de cada aula
    const classesWithBike = await Promise.all(
      latestClasses.map(async (cs: any) => {
        let bikeNumber: number | null = null;

        if (cs.bikeId) {
          const bike = await Bike.findByPk(cs.bikeId, {
            attributes: ['bikeNumber'], // ou bikeNumber
          });
          bikeNumber = bike ? bike.bikeNumber : null;
        }

        return {
          id: cs.Class.id,
          date: cs.Class.date,
          time: cs.Class.time,
          status: cs.status,
          productTypeId: cs.Class.productTypeId,
          bikeId: cs.bikeId,
          bikeNumber,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: classesWithBike,
    });
  } catch (error) {
    console.error('Erro ao buscar últimas aulas do aluno:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar últimas aulas do aluno' });
  }
};

export const getUserTransactions = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { userId } = req.params;

        // Validar se o ID do usuário foi fornecido
        if (!userId) {
            return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório' });
        }

        // Verificar se o usuário existe
        const user = await Person.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        // Buscar transações associadas ao usuário
        const studentId = userId;
        const transactions = await Transactions.findAll({
            where: { studentId},
            attributes: ['transactionId', 'amount', 'status', 'createdAt'], // Ajuste os campos conforme necessário
            order: [['createdAt', 'DESC']], // Ordenar pelas mais recentes
        });

        return res.status(200).json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        console.error('Erro ao buscar transações do usuário:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar transações do usuário' });
    }
};

export const getAllProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
        // 🆕 Pegar studentId do token JWT
        const studentId = (req as any).user?.id;
        
        const { page = 1, pageSize = 10 } = req.query;
        const limit = parseInt(pageSize as string, 10);
        const offset = (parseInt(page as string, 10) - 1) * limit;

        // 1. Buscar configKey 'app_product'
        const config = await Config.findOne({ where: { configKey: 'app_product' } });

        // 2. Se existir, montar filtro de tipos permitidos
        let productTypeFilter: any = {};
        if (config?.configValue) {
            const allowedProductTypes = config.configValue
                .split(',')
                .map((id) => parseInt(id.trim(), 10))
                .filter(Boolean);

            productTypeFilter = {
                productTypeId: { [Op.in]: allowedProductTypes }
            };
        }

        // 3. Buscar produtos com ou sem filtro
        const { rows: products, count: totalRecords } = await Product.findAndCountAll({
            where: {
                ...productTypeFilter,
                active: 1, // 🆕 Filtra apenas produtos ativos
            },
            include: [
                {
                    model: ProductType,
                    as: 'productType',
                    attributes: ['name'],
                    include: [
                        {
                            model: Place,
                            as: 'place',
                            attributes: ['name'],
                        },
                    ],
                },
            ],
            limit,
            offset,
        });

        // 4. 🆕 ENRIQUECER COM purchaseInfo (se tiver studentId)
        let enrichedProducts = products.map(p => p.toJSON());
        
        if (studentId) {
            enrichedProducts = await Promise.all(
                products.map(async (product) => {
                    const productJson = product.toJSON();
                    
                    // Contar quantas vezes o aluno já comprou este produto
                    const purchaseCount = await Item.count({
                        where: {
                            studentId,
                            itemId: product.id,
                        },
                    });

                    // Calcular se pode comprar
                    const canPurchase =
                        product.purchaseLimit === 0 ||
                        purchaseCount < product.purchaseLimit;

                    // Calcular quantas compras restam
                    const remainingPurchases =
                        product.purchaseLimit === 0
                            ? null // null = ilimitado
                            : Math.max(0, product.purchaseLimit - purchaseCount);

                    return {
                        ...productJson,
                        // 🆕 Adicionar purchaseInfo
                        purchaseInfo: {
                            currentPurchases: purchaseCount,
                            maxAllowed: product.purchaseLimit,
                            canPurchase,
                            remainingPurchases,
                        },
                    };
                })
            );
        } else {
            // Se não tiver studentId, adicionar purchaseInfo vazio
            enrichedProducts = products.map(p => ({
                ...p.toJSON(),
                purchaseInfo: {
                    currentPurchases: 0,
                    maxAllowed: p.purchaseLimit,
                    canPurchase: true,
                    remainingPurchases: p.purchaseLimit === 0 ? null : p.purchaseLimit,
                },
            }));
        }

        // 5. Retornar resultado com paginação
        return res.status(200).json({
            success: true,
            data: enrichedProducts, // 🆕 Retorna produtos enriquecidos
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: parseInt(page as string, 10),
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar produtos',
        });
    }
};


export const getStudentExtrato = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'ID do aluno é obrigatório' });
    }

    // 1) Todas as inscrições do aluno com dados da aula
    const classStudents = await ClassStudent.findAll({
      where: { studentId },
      include: [{ model: Class, attributes: ['id', 'date', 'time', 'productTypeId'] }],
      order: [[Class, 'date', 'DESC']],
    });

    const aulas = classStudents.map((cs: any) => ({
      classStudentId: cs.id,
      classId: cs.classId,
      date: cs.Class?.date,
      time: cs.Class?.time,
      productTypeId: cs.Class?.productTypeId,
      status: cs.status,           // 1 = ativa, 0 = cancelada
      checkin: cs.checkin,
      bikeId: cs.bikeId,
      transactionId: cs.transactionId,  // creditBatch usado
    }));

    // 2) Todos os lotes de crédito do aluno
    const credits = await Credit.findAll({
      where: { idCustomer: studentId },
      order: [['expirationDate', 'ASC']],
      attributes: ['id', 'creditBatch', 'productTypeId', 'availableCredits', 'usedCredits', 'status', 'expirationDate', 'origin', 'createdAt'],
    });

    // 3) Cruzamento: para cada aula cancelada, checar se crédito foi devolvido
    const agora = new Date();
    const cruzamento = aulas
      .filter(a => a.status === 0 || a.status === false)
      .map(a => {
        const lote = credits.find((c: any) => c.creditBatch === a.transactionId);
        return {
          classId: a.classId,
          date: a.date,
          transactionId: a.transactionId,
          loteEncontrado: !!lote,
          loteStatus: lote?.status ?? null,
          loteExpirado: lote?.expirationDate ? lote.expirationDate < agora : null,
          availableCredits: lote?.availableCredits ?? null,
          usedCredits: lote?.usedCredits ?? null,
          creditoDevolvido: lote ? lote.availableCredits > 0 : false,
        };
      });

    return res.status(200).json({
      success: true,
      data: {
        aulas,
        creditos: credits,
        cancelamentos: cruzamento,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar extrato:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar extrato' });
  }
};