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
    const { studentId } = req.body;

    const student = await Person.findByPk(studentId);
    if (!student) return res.status(404).json({ message: 'Estudante não encontrado' });

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

    // Filtro de data + (opcional) tipo de produto
    const whereCondition: any = {
      date: { [Op.gte]: formattedStartDate, [Op.lte]: formattedEndDate },
    };
    if (allowedProductTypes.length > 0) {
      whereCondition.productTypeId = { [Op.in]: allowedProductTypes };
    }

    const availableClasses = await Class.findAll({
      attributes: ['date'],
      where: whereCondition,
      // ❌ remove o include do Product
      group: ['date'],
      order: [['date', 'ASC']],
    });

    if (!availableClasses.length) {
      return res.status(404).json({ message: 'Nenhuma aula disponível para o período' });
    }

    const availableDays = [...new Set(availableClasses.map((c) => c.date))];

    return res.status(200).json({ success: true, availableDays });
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
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
            attributes: ['id', 'time'],
            where: { date },
            order: [['time', 'ASC']]
        });

        if (!availableClasses.length) {
            return res.status(404).json({ message: 'Nenhum horário disponível para esta data' });
        }

        const availableTimes = availableClasses.map(classData => ({
            id: classData.id,
            time: classData.time
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
            attributes: ['id', 'date', 'time', 'teacherId']
        });

        if (!classData) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

        const teacher = classData.teacherId 
            ? await Person.findByPk(classData.teacherId, { attributes: ['name'] }) 
            : null;

        const bikes = await Bike.findAll({
            where: { classId: id },
            attributes: ['bikeNumber', 'status']
        });

        return res.status(200).json({
            success: true,
            class: {
                id: classData.id,
                date: classData.date,
                time: classData.time,
                teacherId: classData.teacherId || '',
                teacherName: teacher ? teacher.name : '',
                bikes: bikes.map(bike => ({
                    bikeNumber: bike.bikeNumber,
                    status: bike.status
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
                bikes: [studentBike]
            }
        });
    } catch (error) {
        console.error("Erro ao buscar aula/aluno:", error);
        return res.status(500).json({ success: false, message: "Erro ao buscar aula/aluno." });
  }
}


export const addStudentToClassWithBikeNumber = async (req: Request, res: Response): Promise<Response> => {
    const { classId, studentId, bikeNumber } = req.body;

    try {
        // 1. Verificar se a aula existe
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

        // 2. Verificar se o aluno já está inscrito na aula
        const existingEnrollment = await ClassStudent.findOne({
            where: { classId, studentId }
        });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Aluno já está inscrito nesta aula' });
        }

        // 3. Verificar o saldo de créditos do aluno
        const studentCredits = await Credit.findAll({
            where: {
                idCustomer: studentId,
                status: 'valid',  // Somente créditos válidos
                expirationDate: { [Op.gte]: new Date() }, // Somente créditos não expirados
            }
        });

        if (studentCredits.length <= 0) {
            return res.status(400).json({ message: 'Créditos insuficientes para o aluno ou créditos expirados' });
        }

        // Somar os créditos disponíveis
        const totalCreditsAvailable = studentCredits.reduce((total, credit) => total + credit.availableCredits, 0);

        if (totalCreditsAvailable <= 0) {
            return res.status(400).json({ message: 'Nenhum crédito disponível para o aluno' });
        }

        // 4. Verificar se a bike está disponível
        const existingBike = await Bike.findOne({
            where: { classId, bikeNumber }
        });
        if (existingBike && existingBike.status !== 'available') {
            return res.status(400).json({ message: 'Bike não está disponível' });
        }

        // 🔥 Agora começa a transação (só depois de todas as validações)
        const transaction = await sequelize.transaction();

        try {
            // 5. Criar a bike se necessário
            const bike = existingBike || await Bike.create({
                classId,
                studentId,
                bikeNumber,
                status: 'in_use'
            }, { transaction });

            // 6. Associar o aluno à aula
            await ClassStudent.create({
                classId,
                PersonId: studentId,
                studentId,
                bikeId: bike.id,
                transactionId: studentCredits[0].creditBatch 
            }, { transaction });

            // Aqui você seleciona o primeiro crédito disponível (ou pode escolher um específico se necessário)
            const creditToUse = studentCredits[0]; // Pegando o primeiro crédito disponível

            // Atualiza o crédito
            creditToUse.availableCredits -= 1; // Subtrai 1 do crédito disponível
            creditToUse.usedCredits += 1; // Adiciona 1 no crédito usado

            // Se o crédito não tiver mais disponível, você pode atualizar o status para 'used'
            if (creditToUse.availableCredits <= 0) {
                creditToUse.status = 'used';
            }

            // Salvar as alterações
            await creditToUse.save();

            // 8. Confirmar a transação
            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: 'Aluno adicionado à aula e bike atribuída com sucesso'
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Erro durante a transação:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro durante a operação',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }

    } catch (error) {
        console.error('Erro ao adicionar aluno à aula:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao adicionar aluno à aula',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};


export const cancelStudentPresenceInClass = async (req: Request, res: Response): Promise<Response> => {
    const { classId, studentId } = req.body;

    // Iniciar uma transação para garantir consistência
    const transaction = await sequelize.transaction();

    try {
        // 1. Verificar se a aula existe
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

      

        // 2. Verificar se o horário atual está dentro do limite de cancelamento (2 horas antes da aula)
        const classDateTime = new Date(`${classData.date}T${classData.time}`);
        const now = new Date();

        const twoHoursBeforeClass = new Date(classDateTime);
        twoHoursBeforeClass.setHours(twoHoursBeforeClass.getHours() - 2);

        if (now >= twoHoursBeforeClass) {
            return res.status(400).json({
                success: false,
                message: 'O cancelamento só é permitido até 2 horas antes da aula.',
            });
        }

        // 3. Verificar se o aluno está associado à aula
        const classStudent = await ClassStudent.findOne({
            where: { classId, studentId },
        });

        if (!classStudent) {
            return res.status(404).json({ message: 'Aluno não está registrado nesta aula' });
        }

        if (classStudent.status === false) {
            return res.status(400).json({ message: 'Aula não disponível para cancelamento' });
        }

        // 4. Buscar a bike associada ao aluno na aula
        const bike = await Bike.findOne({
            where: { classId, studentId },
        });

        if (bike) {
            // Remover a bike da aula
            await bike.destroy({ transaction });
        }

        // 5. Atualizar o status do registro no ClassStudent para false
        await classStudent.update(
            { status: false },
            { transaction }
        );

        // 6. Devolver 1 crédito ao saldo do aluno
        const studentBalance = await Balance.findOne({
            where: { idCustomer: studentId },
        });

        if (studentBalance) {
            studentBalance.balance += 1; // Adicionar 1 crédito
            await studentBalance.save({ transaction });
        }

        // Confirmar a transação
        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Presença do aluno cancelada e crédito devolvido com sucesso',
        });
    } catch (error) {
        // Reverter a transação em caso de erro
        await transaction.rollback();
        console.error('Erro ao cancelar presença do aluno:', error);

        return res.status(500).json({
            success: false,
            message: 'Erro ao cancelar presença do aluno',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
};

export const nextClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { studentId } = req.params;

        // Verificar se o ID do aluno foi fornecido
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'ID do aluno é obrigatório' });
        }

        // Validar se o aluno existe
        const student = await Person.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Aluno não encontrado' });
        }

        // Buscar todas as aulas associadas ao aluno na tabela ClassStudent
        const classStudentRecords = await ClassStudent.findAll({
            where: {
                studentId,
            },
            attributes: ['classId'], // Apenas o campo classId para buscar as aulas
        });

        // Extrair os IDs das aulas
        const classIds = classStudentRecords.map(record => record.classId);

        // Caso o aluno não tenha aulas associadas
        if (!classIds.length) {
            return res.status(200).json({ success: true, message: 'Nenhuma próxima aula encontrada', data: [] });
        }

        // Buscar as próximas aulas na tabela Class
        const now = new Date();
        const nextClasses = await Class.findAll({
            where: {
                id: classIds, // Filtrar pelas aulas associadas ao aluno
                date: {
                    [Op.gte]: now, // Apenas aulas futuras
                },
            },
            order: [['date', 'ASC'], ['time', 'ASC']], // Ordenar por data e horário
            attributes: ['id', 'date', 'time'], // Campos necessários
        });

        // Caso não haja próximas aulas
        if (!nextClasses.length) {
            return res.status(200).json({ success: true, message: 'Nenhuma próxima aula encontrada', data: [] });
        }

        // Retornar as próximas aulas
        return res.status(200).json({ success: true, data: nextClasses });
    } catch (error) {
        console.error('Erro ao listar próximas aulas:', error);
        return res.status(500).json({ success: false, message: 'Erro ao listar próximas aulas' });
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
        

        // Buscar todas as aulas relacionadas ao aluno na tabela ClassStudent
        const classStudentRecords = await ClassStudent.findAll({
            where: { studentId },
            attributes: ['classId', 'checkin'],
        });

        // Separar as aulas agendadas e realizadas
        const scheduledClassesCount = classStudentRecords.filter(record => record.checkin === null).length;

        const completedClassesCount = classStudentRecords.filter(record => record.checkin !== null).length;

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
            where: productTypeFilter,
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

        // 4. Retornar resultado com paginação
        return res.status(200).json({
            success: true,
            data: products,
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