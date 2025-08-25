import { Request, Response } from 'express';
import Class from '../models/Class.model';
import ClassStudent from '../models/ClassStudent.model';
import { authenticateToken } from '../core/token/authenticateToken';
import moment from 'moment';
import Bike from '../models/Bike.model';
import { Op } from 'sequelize';
import Person from '../models/Person.model';
import ProductType from '../models/ProductType.model';
import Balance from '../models/Balance.model';
import { updateCustomerBalance } from './balanceController';
import { parse, format } from 'date-fns'; // Importar o `parse` e `format` de `date-fns`
import sequelize from '../config/database';

// CREATE
export const createClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const validation = validateClassData(req.body);

        // Verificar se os dados são válidos
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const {
            date,
            time,
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productTypeId,
            bikes,
            active,
        } = req.body;

        // Formatar a data corretamente
        //const formattedDate = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');

        // Criação da aula
        const newClass = await Class.create({
            date,
            time,
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productTypeId,
            active,
        });

        // Processar cada bike do array `bikes` e garantir que as bikes existam na tabela `Bike`
        if (bikes && bikes.length > 0) {
            const classId = newClass.id;

            for (const bike of bikes) {
                const { studentId, bikeNumber } = bike;

                let bikeRecord = await Bike.findOne({ where: { bikeNumber } });
                if (!bikeRecord) {
                    bikeRecord = await Bike.create({ bikeNumber, status: 'in_use', studentId });
                } else {
                    bikeRecord.status = 'in_use';
                    await bikeRecord.save();
                }

                await ClassStudent.create({
                    classId,
                    PersonId: teacherId,
                    studentId,
                    bikeId: bikeRecord.bikeNumber,
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Aula e bikes associadas criadas com sucesso',
            classId: newClass.id,
        });
    } catch (createError) {
        console.error('Erro ao criar aula:', createError);
        return res.status(500).json({
            success: false,
            data: createError,
            error: 'Erro ao criar aula',
        });
    }
};

// CREATE MULTIPLE AULAS
export const createMultipleClasses = async (req: Request, res: Response): Promise<Response> => {
    try {
        const validation = validateClassDataRecorring(req.body);

        // Verificar se os dados são válidos
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const {
            date, // Array de dias da semana (ex: ['Monday', 'Tuesday'])
            time, // Array de horários (ex: ['09:00', '10:00'])
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productTypeId,
            bikes,
            active,
        } = req.body;

        // Criar as aulas para cada combinação de dia e horário
        const createdClasses = [];

        // Iterar sobre os dias e horários
        for (const day of date) {
            for (const h of time) {
                // Criar a aula para o dia e horário atuais
                const newClass = await Class.create({
                    date: day, // O dia da semana deve ser convertido em uma data, se necessário
                    time: h, // Usar o horário fornecido
                    teacherId,
                    limit,
                    hasCommission,
                    kickbackRule,
                    kickback,
                    productTypeId,
                    active,
                });

                // Processar cada bike do array `bikes` e associar as bikes à aula
                if (bikes && bikes.length > 0) {
                    const classId = newClass.id;

                    for (const bike of bikes) {
                        const { studentId, bikeNumber } = bike;

                        let bikeRecord = await Bike.findOne({ where: { bikeNumber } });
                        if (!bikeRecord) {
                            bikeRecord = await Bike.create({ bikeNumber, status: 'in_use', studentId });
                        } else {
                            bikeRecord.status = 'in_use';
                            await bikeRecord.save();
                        }

                        await ClassStudent.create({
                            classId,
                            PersonId: teacherId,
                            studentId,
                            bikeId: bikeRecord.bikeNumber,
                        });
                    }
                }

                // Adicionar a aula criada ao array de resultados
                createdClasses.push(newClass);
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Aulas e bikes associadas criadas com sucesso',
            createdClasses,
        });
    } catch (createError) {
        console.error('Erro ao criar aulas:', createError);
        return res.status(500).json({
            success: false,
            data: createError,
            error: 'Erro ao criar aulas',
        });
    }
};


export const getAllClasses = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        authenticateToken(req, res, async () => {
            try {
                const { date, time, productType, teacherId, page = 1, pageSize = 10 } = req.body;

                // Critérios de busca dinâmica para aulas
                const criteria: any = {};

                // Definir data de hoje
                const today = new Date();
                const formattedToday = format(today, 'yyyy-MM-dd'); // Formatar a data de hoje para 'YYYY-MM-DD'

                if (date) {
                    // Formatando a data recebida no formato 'DD/MM/YYYY' para 'YYYY-MM-DD'
                    const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
                    criteria.date = format(parsedDate, 'yyyy-MM-dd'); // Formata para 'YYYY-MM-DD'
                } else {
                    // Se não for passada data, buscar a partir de hoje
                    criteria.date = { [Op.gte]: formattedToday };
                }

                if (time) {
                    criteria.time = time; // Busca por hora exata
                }

                if (productType) {
                    criteria.productTypeId = productType; // Filtro por ID do tipo de produto
                }

                if (teacherId) {
                    criteria.teacherId = teacherId; // Filtro por ID do professor
                }

                // Configurar paginação
                const limit = parseInt(pageSize, 10); // Número de registros por página
                const offset = (parseInt(page, 10) - 1) * limit; // Deslocamento

                // Busca as aulas com os critérios aplicados e paginação
                const { rows: classes, count: totalRecords } = await Class.findAndCountAll({
                    where: criteria,
                    limit,
                    offset,
                });

                if (!classes || classes.length === 0) {
                    return res.status(404).send('Nenhuma aula encontrada');
                }

                // Buscar os nomes manualmente
                const enrichedClasses = await Promise.all(
                    classes.map(async (classItem) => {
                        const productType = await ProductType.findByPk(classItem.productTypeId, {
                            attributes: ['id', 'name'],
                        });

                        const teacher = await Person.findByPk(classItem.teacherId, {
                            attributes: ['id', 'name'],
                        });

                        return {
                            ...classItem.toJSON(),
                            productType: productType ? productType.name : null,
                            teacher: teacher ? teacher.name : null,
                        };
                    })
                );

                return res.status(200).json({
                    success: true,
                    data: enrichedClasses,
                    pagination: {
                        totalRecords,
                        totalPages: Math.ceil(totalRecords / limit),
                        currentPage: parseInt(page, 10),
                        pageSize: limit,
                    },
                });
            } catch (findError) {
                console.error('Erro ao buscar aulas:', findError);
                return res.status(500).send('Erro ao buscar aulas');
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        return res.status(401).send('Token inválido');
    }
};

export const getClassById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.params.id;

        // Buscar dados da aula pelo ID
        const classData = await Class.findByPk(id);
        if (!classData) {
            return res.status(404).send('Aula não encontrada');
        }

        // Buscar as bicicletas associadas à aula
        const bikes = await Bike.findAll({
            where: { classId: id },
            attributes: ['bikeNumber', 'status', 'studentId'], // Inclui studentId para buscar o nome do aluno, se houver
        });

        // Para cada bicicleta, buscar o nome do aluno associado, se houver
        const formattedBikes = await Promise.all(
            bikes.map(async (bike) => {
                let studentName = null;

                if (bike.studentId) {
                    // Buscar o nome do aluno associado, se houver um studentId
                    const student = await Person.findByPk(bike.studentId, {
                        attributes: ['name'], // Buscar apenas o nome do aluno
                    });
                    studentName = student?.name || null;
                }

                return {
                    bikeNumber: bike.bikeNumber,
                    status: bike.status, // Status da bicicleta (ex.: disponível, em uso, manutenção)
                    studentId: bike.studentId,
                    studentName, // Nome do aluno associado (ou null se não houver)
                };
            })
        );

        // Retornar os dados da aula com as bicicletas
        return res.status(200).json({
            ...classData.toJSON(), // Converte os dados da aula para JSON
            bikes: formattedBikes, // Adiciona as bicicletas ao retorno
        });
    } catch (error) {
        console.error('Erro ao buscar aula:', error);
        return res.status(500).send('Erro ao buscar aula');
    }
};

export const updateClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.params.id; // ID da aula a ser editada
        const {
            date,
            time,
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productTypeId,
            bikes, // Array atualizado de { studentId, bikeNumber, deductCredits }
            active,
        } = req.body;

        // Verificar se a aula existe
        const classData = await Class.findByPk(id);
        if (!classData) {
            return res.status(404).json({ success: false, message: 'Aula não encontrada' });
        }

        // Validação dos Dados
        const validation = validateClassData({ date, time, teacherId, productTypeId });
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        // Atualizar os campos da aula
        await classData.update({
            date: date || classData.date,
            time: time || classData.time,
            teacherId: teacherId || classData.teacherId,
            limit: limit || classData.limit,
            hasCommission: hasCommission !== undefined ? hasCommission : classData.hasCommission,
            kickbackRule: kickbackRule || classData.kickbackRule,
            kickback: kickback || classData.kickback,
            productTypeId: productTypeId || classData.productTypeId,
            active: active !== undefined ? active : classData.active,
        });

        // Atualizar as associações de alunos e bicicletas
        if (bikes && bikes.length >= 0) {
            const classId = classData.id;

            // Obter todos os registros existentes em ClassStudent para esta aula
            const existingClassStudents = await ClassStudent.findAll({ where: { classId } });

            // Processar as novas associações
            for (const bike of bikes) {
                const { studentId = 0, bikeNumber, deductCredits = true, status = 'in_use' } = bike;

                // Verifica se a bike já existe na tabela 'Bike' associada àquela aula específica
                let bikeRecord = await Bike.findOne({ where: { bikeNumber, classId } });

                if (!bikeRecord) {
                    // Cria a bike se ela não existir para essa aula
                    bikeRecord = await Bike.create({ bikeNumber, status, studentId: studentId || null, classId });
                } else {
                    // Atualiza o status da bike para 'in_use'
                    bikeRecord.status = status;
                    bikeRecord.studentId = studentId || 0; // Atualiza o aluno associado, se houver
                    await bikeRecord.save();
                }

                // Verificar se a associação já existe
                const existingAssociation = existingClassStudents.find(
                    (cs) => cs.bikeId === bikeRecord.id
                );

                if (!existingAssociation && studentId) {
                    // Criar nova associação em ClassStudent se o studentId estiver presente
                    await ClassStudent.create({
                        classId,
                        PersonId: teacherId,
                        studentId,
                        bikeId: bikeRecord.id,
                    });

                    // Descontar crédito, se necessário
                    if (deductCredits && studentId) {
                        const balance = await Balance.findOne({ where: { idCustomer: studentId } });
                        if (balance && balance.balance > 0) {
                            balance.balance -= 1;
                            await balance.save();
                        }
                    }
                } else if (existingAssociation && studentId) {
                    // Atualizar associação existente se o studentId estiver presente
                    await existingAssociation.update({
                        studentId,
                        bikeId: bikeRecord.id,
                    });
                } else if (existingAssociation && !studentId) {
                    // Remover a associação se o studentId for null
                    await existingAssociation.destroy();
                }
            }

            // Remover associações que não estão mais presentes no array `bikes`
            const bikesToKeep = bikes.map((bike: any) => bike.bikeNumber);
            for (const cs of existingClassStudents) {
                const bikeInDb = await Bike.findOne({ where: { id: cs.bikeId, classId } });
                if (!bikeInDb || !bikesToKeep.includes(bikeInDb.bikeNumber)) {
                    await cs.destroy();
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Aula e associações atualizadas com sucesso',
            data: classData,
        });
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar aula',
            details: error.message,
        });
    }
};



// DELETE
export const deleteClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.params.id;
        const classData = await Class.findByPk(id);
        if (!classData) {
            return res.status(404).send('Aula não encontrada');
        }
        await classData.destroy();
        return res.status(200).send('Aula excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        return res.status(500).send('Erro ao excluir aula');
    }
};


export const cancelClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.params.id;
        const classData = await Class.findByPk(id);

        if (!classData) {
            return res.status(404).send('Aula não encontrada');
        }

        // Alterando o status da aula para 2 (cancelada)
        classData.active = false;
        await classData.save();

        // Buscando todos os alunos que estão inscritos na aula
        const classStudents = await ClassStudent.findAll({ where: { classId: id } });

        // Atualizando os status dos alunos na tabela ClassStudent e devolvendo crédito
        for (const classStudent of classStudents) {
            // Atualizando o status do aluno (ex: 'cancelado')
            classStudent.status = false; // Exemplo de status
            await classStudent.save();

            // Devolver 1 crédito usando a função updateCustomerBalance
            const student = await Person.findByPk(classStudent.studentId);
            if (student) {
                // Atualiza o saldo de crédito do aluno (devolve 1 crédito)
                await updateCustomerBalance(student.id, 1, classStudent.transactionId, true, classData.productTypeId); // true indicando que é um crédito devolvido
            }
        }

        return res.status(200).send('Aula cancelada com sucesso e créditos devolvidos');
    } catch (error) {
        console.error('Erro ao cancelar aula:', error);
        return res.status(500).send('Erro ao cancelar aula');
    }
};


export const validateClassData = (data: any): { isValid: boolean; message?: string } => {
    const { date, time, teacherId, productTypeId } = data;

    // Validação da data
    if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
        return { isValid: false, message: 'Data inválida ou ausente.' };
    }

    // Validação do horário
    if (!time) {
        return { isValid: false, message: 'Horário é obrigatório.' };
    }

    // Validação do professor
    if (!teacherId) {
        return { isValid: false, message: 'ID do professor é obrigatório.' };
    }

    // Validação do tipo de produto
    if (!productTypeId) {
        return { isValid: false, message: 'Tipo de produto é obrigatório.' };
    }

    // Se todas as validações passarem
    return { isValid: true };
};


export const validateClassDataRecorring = (data: any): { isValid: boolean; message?: string } => {
    const { date, time, teacherId, productTypeId } = data;

    // Validação dos dias
    if (!date || !Array.isArray(date) || date.length === 0) {
        return { isValid: false, message: 'Dias da semana são obrigatórios.' };
    }
  
    // Validação dos horários
    if (!time || !Array.isArray(time) || time.length === 0) {
        return { isValid: false, message: 'Horários são obrigatórios.' };
    }
    for (const h of time) {
        if (!moment(h, 'HH:mm', true).isValid()) {
            return { isValid: false, message: `Horário inválido: ${time}.` };
        }
    }

    // Validação do professor
    if (!teacherId) {
        return { isValid: false, message: 'ID do professor é obrigatório.' };
    }

    // Validação do tipo de produto
    if (!productTypeId) {
        return { isValid: false, message: 'Tipo de produto é obrigatório.' };
    }

    // Se todas as validações passarem
    return { isValid: true };
};

export async function checkinClassStudent(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Parâmetro id inválido." });
    }

    // Tenta marcar checkin=1 (apenas se estiver NULL ou 0)
    const [affected] = await ClassStudent.update(
      {
        checkin: 1,
        // Se tiver essa coluna no schema, registre o momento do check-in:
        // checkinAt: fn('NOW'),
      },
      {
        where: {
          id,
          [Op.or]: [
            { checkin: { [Op.is]: null } }, // pega NULL
            { checkin: { [Op.eq]: 0 } },    // pega 0
          ],
        },
        silent: false,
        // limit: 1, // (Postgres ignora; em MySQL 8+ dá para usar, senão re-fecth abaixo já resolve)
      }
    );

    if (affected === 0) {
      // Pode ser porque já estava 1 ou porque não existe
      const cs = await ClassStudent.findByPk(id, {
        attributes: ["id", "studentId", "classId", "checkin", "createdAt", "updatedAt"],
      });

      if (!cs) {
        return res.status(404).json({ success: false, message: "ClassStudent não encontrado." });
      }

      if (cs.checkin === 1) {
        return res.status(200).json({
          success: true,
          message: "Check-in já estava efetuado.",
          data: cs,
        });
      }

      // Se chegou aqui e não é 1, algo impediu o update (ex.: race condition). Tente forçar:
      await cs.update({ checkin: 1 /*, checkinAt: fn("NOW")*/ });
      const updated = await ClassStudent.findByPk(id, {
        attributes: ["id", "studentId", "classId", "checkin", "createdAt", "updatedAt"],
      });
      return res.status(200).json({
        success: true,
        message: "Check-in efetuado com sucesso.",
        data: updated,
      });
    }

    // Atualizou de 0/NULL -> 1
    const updated = await ClassStudent.findByPk(id, {
      attributes: ["id", "studentId", "classId", "checkin", "createdAt", "updatedAt"],
    });

    return res.status(200).json({
      success: true,
      message: "Check-in efetuado com sucesso.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Erro ao efetuar check-in:", error);
    return res.status(500).json({ success: false, message: "Erro ao efetuar check-in." });
  }
}


export async function checkinClassStudentByPair(req: Request, res: Response): Promise<Response> {
  try {
    // aceita via params (GET) ou body (POST)
    const classId = req.body.classId;
    const studentId = req.body.studentId;

    if (!classId || !studentId) {
      return res.status(400).json({ success: false, message: 'classId e studentId são obrigatórios.' });
    }

    // (opcional) validar se a aula existe
    // const cls = await Class.findByPk(classId, { attributes: ['id'] });
    // if (!cls) return res.status(404).json({ success: false, message: 'Aula não encontrada.' });

    // transação + lock para idempotência em concorrência
    const t = await sequelize.transaction();
    try {
      // encontre o vínculo; se existir mais de um (não deveria), escolha o mais recente
      const cs = await ClassStudent.findOne({
        where: { classId, studentId },
        order: [['createdAt', 'DESC']],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!cs) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Aluno não está registrado nesta aula.' });
      }

      // já checado? idempotente
      if (cs.checkin === 1) {
        await t.commit();
        return res.status(200).json({
          success: true,
          message: 'Check-in já estava efetuado.',
          data: {
            id: cs.id,
            classId: cs.classId,
            studentId: cs.studentId,
            checkin: cs.checkin,
            // checkinAt: cs.checkinAt,
          },
        });
      }

      // marque checkin=1 apenas se estiver 0/NULL
      const [affected] = await ClassStudent.update(
        { checkin: 1 /*, checkinAt: fn('NOW')*/ },
        {
          where: {
            id: cs.id,
            [Op.or]: [
              { checkin: { [Op.is]: null } },
              { checkin: { [Op.eq]: 0 } },
            ],
          },
          transaction: t,
        }
      );

      // se não atualizou, provavelmente houve corrida; refetch
      const updated = await ClassStudent.findByPk(cs.id, {
        attributes: ['id', 'classId', 'studentId', 'checkin', 'createdAt', 'updatedAt' /*, 'checkinAt'*/],
        transaction: t,
      });

      await t.commit();

      if (affected === 0 && updated?.checkin !== 1) {
        // não mudou por algum motivo inesperado
        return res.status(409).json({ success: false, message: 'Não foi possível efetivar o check-in.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Check-in efetuado com sucesso.',
        data: updated,
      });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (error: any) {
    console.error('Erro ao efetuar check-in (pair):', error);
    return res.status(500).json({ success: false, message: 'Erro ao efetuar check-in.' });
  }
}