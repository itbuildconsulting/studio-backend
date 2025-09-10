import { Request, Response } from 'express';
import WaitingList from '../models/WaitingList.model';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';
import sequelize from '../config/database';
import { Op, Transaction } from 'sequelize';
import Bike from '../models/Bike.model';
import Credit from '../models/Credit.model';

export const addToWaitingList = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { studentId, classId } = req.body;

        // Verificar se a aula existe
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

        // Verificar se a aula já está cheia
        const enrolledCount = await ClassStudent.count({ where: { classId } });
        if (enrolledCount < classData.limit) {
            return res.status(400).json({ message: 'Ainda há vagas na aula, inscrição direta disponível.' });
        }

        // Verificar se o aluno já está na lista de espera
        const alreadyInWaitingList = await WaitingList.findOne({
            where: { studentId, classId }
        });

        if (alreadyInWaitingList) {
            return res.status(400).json({ message: 'Aluno já está na lista de espera.' });
        }

        // Definir a ordem do aluno na fila (última posição)
        const lastOrder = await WaitingList.max('order', { where: { classId } }) || 0;
        const newOrder = (Number(lastOrder) || 0) + 1;

        // Adicionar aluno à lista de espera
        const waitingEntry = await WaitingList.create({ studentId, classId, order: newOrder });

        return res.status(201).json({
            success: true,
            message: 'Aluno adicionado à lista de espera com sucesso.',
            data: waitingEntry
        });

    } catch (error) {
        console.error('Erro ao adicionar aluno à lista de espera:', error);
        return res.status(500).json({ success: false, message: 'Erro ao adicionar aluno à lista de espera' });
    }
};


export const promoteFromWaitingList = async (classId: number): Promise<void> => {
    try {
        const firstInLine = await WaitingList.findOne({
            where: { classId },
            order: [['order', 'ASC']]
        });

        if (!firstInLine) {
            console.log('Nenhum aluno na lista de espera.');
            return;
        }

        // Criar entrada na tabela ClassStudent para adicionar o aluno
        await ClassStudent.create({
            classId: firstInLine.classId,
            studentId: firstInLine.studentId
        });

        // Remover aluno da lista de espera
        await firstInLine.destroy();

        console.log(`Aluno ${firstInLine.studentId} foi movido da lista de espera para a aula.`);

    } catch (error) {
        console.error('Erro ao promover aluno da lista de espera:', error);
    }
};


export const promoteFromWaitingListWithBike = async (req: Request, res: Response) => {
  const { classId, studentId, bikeNumber, productTypeId: productTypeIdOverride } = req.body ?? {};

  try {
    // -------- validação básica --------
    const cId = Number(classId);
    const sId = Number(studentId);
    const bNum = Number(bikeNumber);

    if (!Number.isFinite(cId) || !Number.isFinite(sId) || !Number.isFinite(bNum)) {
      return res.status(400).json({ success: false, message: 'classId, studentId e bikeNumber são obrigatórios e devem ser numéricos.' });
    }

    // 1) Aula existe?
    const classData = await Class.findByPk(cId);
    if (!classData) return res.status(404).json({ success: false, message: 'Aula não encontrada.' });

    // 2) O aluno está na waiting list desta aula?
    const wl = await WaitingList.findOne({ where: { classId: cId, studentId: sId } });
    if (!wl) {
      return res.status(404).json({ success: false, message: 'Aluno não está na lista de espera desta aula.' });
    }

    // 3) Descobrir productTypeId (prioriza o da aula; aceita override no body)
    const productTypeId = classData.productTypeId ?? productTypeIdOverride;
    if (!productTypeId) {
      return res.status(400).json({ success: false, message: 'productTypeId não informado e não definido na aula.' });
    }

    // 4) Checagens rápidas (fora da tx)
    const already = await ClassStudent.findOne({ where: { classId: cId, studentId: sId } });
    if (already) return res.status(400).json({ success: false, message: 'Aluno já está inscrito nesta aula.' });

    const bikeRowQuick = await Bike.findOne({ where: { classId: cId, bikeNumber: bNum } });
    if (bikeRowQuick && bikeRowQuick.status !== 'available' && bikeRowQuick.studentId !== sId) {
      return res.status(409).json({ success: false, message: 'Bike já está em uso por outro aluno.' });
    }

    // --------- TRANSAÇÃO (atomicidade) ---------
    const t: Transaction = await sequelize.transaction();
    try {
      // Revalida matrícula sob lock
      const enrolled = await ClassStudent.findOne({
        where: { classId: cId, studentId: sId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (enrolled) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Aluno já está inscrito nesta aula.' });
      }

      // FEFO: pega o lote de crédito mais antigo, válido e com saldo para ESTE tipo
      const now = new Date();
      const creditLot = await Credit.findOne({
        where: {
          idCustomer: sId,              // ajuste se seu campo for outro
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
        return res.status(400).json({ success: false, message: 'Créditos insuficientes para este tipo de aula (ou vencidos).' });
      }

      // Bike: trava/atribui
      let bike = await Bike.findOne({
        where: { classId: cId, bikeNumber: bNum },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!bike) {
        bike = await Bike.create(
          { classId: cId, studentId: sId, bikeNumber: bNum, status: 'in_use' },
          { transaction: t }
        );
      } else {
        if (bike.status !== 'available' && bike.studentId !== sId) {
          await t.rollback();
          return res.status(409).json({ success: false, message: 'Bike já está em uso por outro aluno.' });
        }
        await bike.update({ studentId: sId, status: 'in_use' }, { transaction: t });
      }

      // Vincula aluno à aula (guarde a origem do crédito)
      const cs = await ClassStudent.create(
        {
          classId: cId,
          studentId: sId,
          PersonId: sId,                 // se seu modelo usa também PersonId
          bikeId: bike.id,
          transactionId: creditLot.creditBatch, // ou outro campo de rastreio
        },
        { transaction: t }
      );

      // Consome 1 crédito do lote
      creditLot.availableCredits -= 1;
      creditLot.usedCredits += 1;
      if (creditLot.availableCredits <= 0) creditLot.status = 'used';
      await creditLot.save({ transaction: t });

      // Remove da waiting list (do aluno promovido)
      await wl.destroy({ transaction: t });

      await t.commit();
      return res.status(200).json({
        success: true,
        message: 'Aluno promovido da lista de espera: matriculado e bike atribuída; 1 crédito consumido.',
        data: {
          classStudentId: cs.id,
          bikeId: bike.id,
          bikeNumber: bNum,
        },
      });
    } catch (err) {
      await t.rollback();
      console.error('[promoteFromWaitingListWithBike] tx error:', err);
      return res.status(500).json({ success: false, message: 'Erro durante a transação.', error: String((err as any)?.message ?? err) });
    }
  } catch (error) {
    console.error('[promoteFromWaitingListWithBike] error:', error);
    return res.status(500).json({ success: false, message: 'Erro ao promover aluno.', error: String((error as any)?.message ?? error) });
  }
};


type ListBody = {
  personId: number,
  page?: number;           // 1..
  pageSize?: number;       // default 20
  sort?: 'recent' | 'position'; // recent = createdAt desc; position = order asc
  classStatus?: string;    // opcional: filtrar por status da aula
  includeClass?: boolean;  // default true
};

type Body = { personId?: number | string };

export async function listMyWaitingListsPost(req: Request, res: Response) {
  try {
    const { personId } = (req.body ?? {}) as Body;
    const id = Number(personId);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'personId inválido' });
    }

    const rows = await WaitingList.findAll({
      where: { studentId: id },
      include: [{ model: Class, as: 'class' }], // sem limitar atributos para evitar “unknown column”
      order: [['createdAt', 'DESC']],
    });

    const data = rows.map((w: any) => {
      const cls = w.get('class') as any | undefined;

      let date: string | null = null;
      let time: string | null = null;

      // Caso 1: startAt/endAt (datetime)
      if (cls?.startAt) {
        const s = new Date(cls.startAt);
        date = s.toISOString().slice(0, 10);
        time = s.toISOString().slice(11, 16);
      }

      // Caso 2: date + startTime/endTime (campos separados)
      if (!date && cls?.date) {
        const d = new Date(cls.date);
        date = isNaN(d.getTime()) ? String(cls.date) : d.toISOString().slice(0, 10);
      }
      if (!time && cls?.time) time = String(cls.time).slice(0, 5);

      return {
        id: w.id,
        studentId: w.studentId,
        classId: w.classId,
        order: w.order,
        joinedAt: w.createdAt,
        class: cls
          ? {
              id: cls.id ?? null,
              // só o que você pediu:
              date,
              time,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      personId: id,
      total: data.length,
      data,
    });
  } catch (e: any) {
    console.error('[waitingLists] listMyWaitingListsPost', e);
    return res.status(500).json({ success: false, error: 'internal_error' });
  }
}

export const removeFromWaitingList = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { studentId, classId } = req.body;

        // Verificar se o aluno está na lista de espera
        const entry = await WaitingList.findOne({ where: { studentId, classId } });
        if (!entry) {
            return res.status(404).json({ message: 'Aluno não encontrado na lista de espera.' });
        }

        // Remover aluno da lista de espera
        await entry.destroy();

        // Ajustar ordem da lista de espera
        await WaitingList.update({ order: sequelize.literal('order - 1') }, {
            where: {
                classId,
                order: { [Op.gt]: entry.order }
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Aluno removido da lista de espera.'
        });

    } catch (error) {
        console.error('Erro ao remover aluno da lista de espera:', error);
        return res.status(500).json({ success: false, message: 'Erro ao remover aluno da lista de espera' });
    }
};
