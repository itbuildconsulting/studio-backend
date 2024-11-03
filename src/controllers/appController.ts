import { Request, Response } from 'express';
import Balance from '../models/Balance.model';
import { authenticateToken } from '../core/token/authenticateToken';
import { Op } from 'sequelize';
import Class from '../models/Class.model';
import Person from '../models/Person.model';
import ClassStudent from '../models/ClassStudent.model';
import Bike from '../models/Bike.model';
import sequelize from '../config/database';

export const balance = async (req: Request, res: Response): Promise<Response | void> => {
    const personId = req.body.user?.id;    
    try {
        return authenticateToken(req, res, async () => {
           
            if (!personId) {
                return res.status(401).json({ message: 'Token inválido' });
            }

            try {
                const balanceData = await Balance.findOne({
                    where: { idCustomer: personId }
                });

                if (!balanceData) {
                    return res.status(404).json({ message: 'Saldo não encontrado para este usuário' });
                }

                return res.status(200).json({
                    success: true,
                    balance: balanceData
                });
            } catch (error) {
                console.error('Erro ao validar token:', error);

                const errorMessage = error instanceof Error ? error.message : 'Token inválido';

                return res.status(401).json({
                    success: false,
                    message: errorMessage
                });
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        return res.status(401).send('Token inválido');
    }
};

export const schedule = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { month, year } = req.body;
        const startDate = month && year ? new Date(year, month - 1, 1) : new Date();
        const endDate = month && year ? new Date(year, month, 0) : undefined;

        const whereCondition: any = { date: { [Op.gte]: startDate } };
        if (endDate) whereCondition.date[Op.lte] = endDate;

        const availableClasses = await Class.findAll({
            attributes: ['date'],
            where: whereCondition,
            group: ['date'],
            order: [['date', 'ASC']]
        });

        if (!availableClasses.length) {
            return res.status(404).json({ message: 'Nenhuma aula disponível para o período' });
        }

        const availableDays = [...new Set(availableClasses.map(classData => classData.date))];

        return res.status(200).json({
            success: true,
            availableDays
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

export const addStudentToClassWithBikeNumber = async (req: Request, res: Response): Promise<Response> => {
    const { classId, studentId, bikeNumber } = req.body;

    // Iniciar uma transação para garantir a consistência dos dados
    const transaction = await sequelize.transaction();
    try {
        // 1. Verificar se a aula existe
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

        // 2. Verificar o saldo de créditos do aluno na tabela Balance
        const studentBalance = await Balance.findOne({
            where: { idCustomer: studentId }
        });

        if (!studentBalance || studentBalance.balance <= 0) {
            return res.status(400).json({ message: 'Créditos insuficientes para o aluno' });
        }

        // 3. Verificar se a bike está disponível para essa aula e número específico
        const existingBike = await Bike.findOne({
            where: { classId, bikeNumber }
        });

        if (existingBike && existingBike.status !== 'available') {
            return res.status(400).json({ message: 'Bike não está disponível' });
        }

        // 4. Criar a bike para a aula e aluno, se ainda não existir
        const bike = existingBike || await Bike.create({
            classId,
            studentId,
            bikeNumber,
            status: 'in_use'
        }, { transaction });

        // 5. Associar o aluno à aula em `ClassStudent`
        await ClassStudent.create({
            classId,
            PersonId: studentId,
            studentId,
            bikeId: bike.id
        }, { transaction });

        // 6. Descontar 1 crédito do saldo do aluno
        studentBalance.balance -= 1;
        await studentBalance.save({ transaction });

        // Confirmar transação
        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Aluno adicionado à aula e bike atribuída com sucesso'
        });

    } catch (error) {
        // Reverter transação em caso de erro
        await transaction.rollback();
        console.error('Erro ao adicionar aluno à aula:', error);

        return res.status(500).json({
            success: false,
            message: 'Erro ao adicionar aluno à aula',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};