import { Request, Response } from 'express';
import { Op, fn, col, literal, WhereOptions } from 'sequelize';
import Person from '../models/Person.model';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';
import Credit from '../models/Credit.model';
import Product from '../models/Product.model';
import ProductType from '../models/ProductType.model';

// ==================== CRÉDITOS EXPIRANDO ====================

export const getCreditsExpiringSoon = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { days = 7 } = req.body;

        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);

        const expiringCredits = await Credit.findAll({
            attributes: [
                'idCustomer',
                [fn('SUM', col('availableCredits')), 'totalCredits'],
                [fn('MIN', col('expirationDate')), 'earliestExpiration']
            ],
            where: {
                status: 'valid',
                availableCredits: { [Op.gt]: 0 },
                expirationDate: { [Op.between]: [now, futureDate] }
            },
            group: ['idCustomer'],
            raw: true
        });

        const enrichedData = await Promise.all(
            expiringCredits.map(async (credit: any) => {
                const person = await Person.findByPk(credit.idCustomer, {
                    attributes: ['id', 'name', 'email', 'phone']
                });

                const daysUntilExpiration = Math.ceil(
                    (new Date(credit.earliestExpiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                return {
                    studentId: credit.idCustomer,
                    name: person?.name || 'Desconhecido',
                    email: person?.email,
                    phone: person?.phone,
                    credits: Math.round(parseFloat(credit.totalCredits)),
                    expirationDate: credit.earliestExpiration,
                    daysUntilExpiration
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: enrichedData.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)
        });

    } catch (error) {
        console.error('Erro ao buscar créditos expirando:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar créditos expirando',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== ALUNOS COM MAIS CRÉDITOS ====================

export const getStudentsWithMostCredits = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { limit = 10 } = req.body;

        const studentsWithCredits = await Credit.findAll({
            attributes: [
                'idCustomer',
                [fn('SUM', col('availableCredits')), 'totalCredits']
            ],
            where: {
                status: 'valid',
                availableCredits: { [Op.gt]: 0 },
                expirationDate: { [Op.gte]: new Date() }
            },
            group: ['idCustomer'],
            order: [[fn('SUM', col('availableCredits')), 'DESC']],
            limit: parseInt(limit.toString()),
            raw: true
        });

        const enrichedData = await Promise.all(
            studentsWithCredits.map(async (credit: any) => {
                const creditData: any = credit;
                const person = await Person.findByPk(creditData.idCustomer, {
                    attributes: ['id', 'name']
                });

                // Última compra
                const lastPurchase = await Credit.findOne({
                    where: {
                        idCustomer: creditData.idCustomer,
                        status: 'valid'
                    },
                    order: [['createdAt', 'DESC']],
                    attributes: ['createdAt'],
                    raw: true  // ✅ Adiciona raw
                }) as any;     // ✅ Cast para any

                return {
                    studentId: creditData.idCustomer,
                    name: person?.name || 'Desconhecido',
                    credits: Math.round(parseFloat(creditData.totalCredits)),
                    lastPurchaseDate: lastPurchase?.createdAt
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: enrichedData
        });

    } catch (error) {
        console.error('Erro ao buscar alunos com mais créditos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar alunos com mais créditos',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== OCUPAÇÃO POR HORÁRIO ====================

export const getOccupancyByTime = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { startDate, endDate } = req.body;

        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const start = startDate ? new Date(startDate) : firstDayMonth;
        const end = endDate ? new Date(endDate) : now;

        const occupancyByTime = await Class.findAll({
            attributes: [
                'time',
                [fn('COUNT', col('Class.id')), 'totalClasses']
            ],
            where: {
                date: { [Op.between]: [start, end] },
                active: true
            },
            include: [{
                model: ClassStudent,
                attributes: [],
                where: { checkin: { [Op.not]: null } },
                required: false
            }],
            group: ['time'],
            order: [['time', 'ASC']],
            raw: true
        });

        // Calcular taxa de ocupação por horário
        const labels: string[] = [];
        const data: number[] = [];

        for (const timeSlot of occupancyByTime) {
            const timeSlotData: any = timeSlot;
            const time: any = timeSlotData.time;
            const totalClasses = parseInt(timeSlotData.totalClasses);

            // Contar check-ins para este horário
            const checkins = await ClassStudent.count({
                include: [{
                    model: Class,
                    where: {
                        time,
                        date: { [Op.between]: [start, end] },
                        active: true
                    },
                    attributes: []
                }],
                where: {
                    checkin: { [Op.not]: null }
                }
            });

            const totalSpots = totalClasses * 20; // 20 bikes por aula
            const occupancyRate = totalSpots > 0 ? (checkins / totalSpots) * 100 : 0;

            labels.push(time);
            data.push(parseFloat(occupancyRate.toFixed(1)));
        }

        return res.status(200).json({
            success: true,
            labels,
            data
        });

    } catch (error) {
        console.error('Erro ao buscar ocupação por horário:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar ocupação por horário',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== TOP PROFESSORES ====================

export const getTopTeachers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { limit = 10 } = req.body;

        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const teacherStats = await Class.findAll({
            attributes: [
                'teacherId',
                [fn('COUNT', col('Class.id')), 'classCount']
            ],
            where: {
                date: { [Op.between]: [firstDayMonth, now] },
                active: true
            },
            group: ['teacherId'],
            order: [[fn('COUNT', col('Class.id')), 'DESC']],
            limit: parseInt(limit.toString()),
            raw: true
        });

        const enrichedTeachers = await Promise.all(
            teacherStats.map(async (teacher: any) => {
                const person = await Person.findByPk(teacher.teacherId, {
                    attributes: ['id', 'name']
                });

                // Calcular ocupação média
                const teacherClasses = await Class.findAll({
                    where: {
                        teacherId: teacher.teacherId,
                        date: { [Op.between]: [firstDayMonth, now] },
                        active: true
                    },
                    attributes: ['id']
                });

                const classIds = teacherClasses.map((c: any) => c.id);

                const totalCheckins = await ClassStudent.count({
                    where: {
                        classId: { [Op.in]: classIds },
                        checkin: { [Op.not]: null }
                    }
                });

                const totalSpots = classIds.length * 20;
                const averageOccupancy = totalSpots > 0
                    ? ((totalCheckins / totalSpots) * 100).toFixed(1)
                    : 0;

                return {
                    teacherId: teacher.teacherId,
                    name: person?.name || 'Desconhecido',
                    classCount: parseInt(teacher.classCount),
                    averageOccupancy: parseFloat(averageOccupancy.toString()),
                    totalStudents: totalCheckins
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: enrichedTeachers
        });

    } catch (error) {
        console.error('Erro ao buscar top professores:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar top professores',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== OCUPAÇÃO POR DIA DA SEMANA ====================

export const getOccupancyByDayOfWeek = async (req: Request, res: Response): Promise<Response> => {
    try {
        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const occupancyByDay = await ClassStudent.findAll({
            attributes: [
                [fn('DAYOFWEEK', col('createdAt')), 'dayOfWeek'],
                [fn('COUNT', col('id')), 'checkins']
            ],
            where: {
                checkin: { [Op.not]: null },
                createdAt: { [Op.between]: [firstDayMonth, now] }
            },
            group: [fn('DAYOFWEEK', col('createdAt'))],
            order: [[fn('DAYOFWEEK', col('createdAt')), 'ASC']],
            raw: true
        });

        // Inicializar array com 7 dias (0 check-ins por padrão)
        const data = [0, 0, 0, 0, 0, 0, 0];

        occupancyByDay.forEach((day: any) => {
            const dayIndex = parseInt(day.dayOfWeek) - 1; // DAYOFWEEK retorna 1-7
            data[dayIndex] = parseInt(day.checkins);
        });

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Erro ao buscar ocupação por dia da semana:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar ocupação por dia da semana',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== INSIGHTS AUTOMÁTICOS ====================

export const getAutomatedInsights = async (req: Request, res: Response): Promise<Response> => {
    try {
        const insights: any[] = [];
        const now = new Date();

        // 1. Verificar alunos inativos
        const inactiveCount = await ClassStudent.count({
            distinct: true,
            col: 'studentId',
            where: {
                checkin: {
                    [Op.and]: [
                        { [Op.not]: null },
                        { [Op.lt]: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) }
                    ]
                }
            }
        });

        if (inactiveCount > 0) {
            insights.push({
                type: 'warning',
                title: 'Alunos Inativos',
                message: `${inactiveCount} alunos não comparecem há mais de 14 dias`,
                action: 'engagement',
                priority: 'high'
            });
        }

        // 2. Verificar horários com alta demanda
        const peakHours = await Class.findAll({
            attributes: [
                'time',
                [fn('COUNT', col('id')), 'count']
            ],
            where: {
                date: { [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            },
            group: ['time'],
            having: literal('COUNT(id) > 20'),
            raw: true
        });

        if (peakHours.length > 0) {
            insights.push({
                type: 'info',
                title: 'Horários de Pico',
                message: `${peakHours.length} horários sempre lotados. Considere criar novas turmas.`,
                action: 'capacity',
                priority: 'medium'
            });
        }

        // 3. Verificar créditos vencendo
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringCreditsSum = await Credit.sum('availableCredits', {
            where: {
                status: 'valid',
                expirationDate: { [Op.between]: [now, next7Days] }
            }
        }) || 0;

        if (expiringCreditsSum > 0) {
            insights.push({
                type: 'warning',
                title: 'Créditos Vencendo',
                message: `${Math.round(expiringCreditsSum)} créditos vencem nos próximos 7 dias`,
                action: 'retention',
                priority: 'high'
            });
        }

        return res.status(200).json({
            success: true,
            data: insights
        });

    } catch (error) {
        console.error('Erro ao gerar insights:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao gerar insights',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};