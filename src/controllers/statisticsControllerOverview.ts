import { Request, Response } from 'express';
import { Op, fn, col, literal, WhereOptions } from 'sequelize';
import Person from '../models/Person.model';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';
import Credit from '../models/Credit.model';
import Transactions from '../models/Transaction.model';
import Bike from '../models/Bike.model';
import Product from '../models/Product.model';

// ==================== VISÃO GERAL ====================

export const getOverviewMetrics = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { startDate, endDate } = req.body;
        
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const start = startDate ? new Date(startDate) : firstDayCurrentMonth;
        const end = endDate ? new Date(endDate) : now;

        // Alunos ativos (fizeram pelo menos 1 check-in no período)
        const activeStudentsCount = await ClassStudent.count({
            distinct: true,
            col: 'studentId',
            where: {
                checkin: { [Op.not]: null },
                createdAt: { [Op.between]: [start, end] }
            }
        });

        // Alunos ativos no mês anterior
        const previousActiveStudentsCount = await ClassStudent.count({
            distinct: true,
            col: 'studentId',
            where: {
                checkin: { [Op.not]: null },
                createdAt: { [Op.between]: [firstDayLastMonth, lastDayLastMonth] }
            }
        });

        const activeStudentsGrowth = previousActiveStudentsCount > 0
            ? ((activeStudentsCount - previousActiveStudentsCount) / previousActiveStudentsCount) * 100
            : 0;

        // Total de check-ins no mês
        const totalCheckins = await ClassStudent.count({
            where: {
                checkin: { [Op.not]: null },
                createdAt: { [Op.between]: [start, end] }
            }
        });

        // Taxa de ocupação
        const totalClassesInPeriod = await Class.count({
            where: {
                date: { [Op.between]: [start, end] },
                active: true
            }
        });

        const totalSpotsAvailable = totalClassesInPeriod * 20; // Assumindo 20 bikes por aula
        const occupancyRate = totalSpotsAvailable > 0
            ? ((totalCheckins / totalSpotsAvailable) * 100).toFixed(1)
            : 0;

        // Total de créditos ativos
        const totalActiveCredits = await Credit.sum('availableCredits', {
            where: {
                status: 'valid',
                expirationDate: { [Op.gte]: now }
            }
        }) || 0;

        // Créditos que vencem nos próximos 7 dias
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        const creditsExpiringNext7Days = await Credit.sum('availableCredits', {
            where: {
                status: 'valid',
                expirationDate: { [Op.between]: [now, next7Days] }
            }
        }) || 0;

        return res.status(200).json({
            success: true,
            activeStudents: activeStudentsCount,
            activeStudentsGrowth: parseFloat(activeStudentsGrowth.toFixed(1)),
            totalCheckins,
            occupancyRate: parseFloat(occupancyRate.toString()),
            totalActiveCredits: Math.round(totalActiveCredits),
            creditsExpiringNext7Days: Math.round(creditsExpiringNext7Days),
            npsScore: 'N/A' // Implementar se tiver sistema de avaliação
        });

    } catch (error) {
        console.error('Erro ao buscar métricas de overview:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar métricas de overview',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== TOP ALUNOS ====================

export const getTopStudents = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { limit = 10, period } = req.body;

        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const start = period ? new Date(period) : firstDayMonth;

        // Buscar alunos com mais aulas
        const topStudents = await ClassStudent.findAll({
            attributes: [
                'studentId',
                [fn('COUNT', col('classId')), 'classCount'],
                [fn('COUNT', fn('DISTINCT', fn('DATE', col('checkin')))), 'uniqueDays']
            ],
            where: {
                checkin: { [Op.not]: null },
                createdAt: { [Op.gte]: start }
            },
            group: ['studentId'],
            order: [[fn('COUNT', col('classId')), 'DESC']],
            limit: parseInt(limit.toString()),
            raw: true
        });

        // Enriquecer com dados do aluno
        const enrichedStudents = await Promise.all(
            topStudents.map(async (student: any) => {
                const person = await Person.findByPk(student.studentId, {
                    attributes: ['id', 'name']
                });

                // Calcular taxa de presença
                const scheduledClasses = await ClassStudent.count({
                    where: {
                        studentId: student.studentId,
                        createdAt: { [Op.gte]: start }
                    }
                });

                const attendedClasses = parseInt(student.classCount);
                const attendanceRate = scheduledClasses > 0
                    ? ((attendedClasses / scheduledClasses) * 100).toFixed(0)
                    : 0;

                return {
                    studentId: student.studentId,
                    name: person?.name || 'Desconhecido',
                    classCount: attendedClasses,
                    streak: parseInt(student.uniqueDays || 0),
                    attendanceRate: parseInt(attendanceRate.toString())
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: enrichedStudents
        });

    } catch (error) {
        console.error('Erro ao buscar top alunos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar top alunos',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== ALUNOS INATIVOS ====================

export const getInactiveStudents = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { days = 14 } = req.body;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Buscar último check-in de cada aluno
        const lastCheckins = await ClassStudent.findAll({
            attributes: [
                'studentId',
                [fn('MAX', col('checkin')), 'lastCheckin']
            ],
            where: {
                checkin: { [Op.not]: null }
            },
            group: ['studentId'],
            raw: true
        });

        // Filtrar apenas os que estão inativos (último check-in antes da data de corte)
        const inactiveStudents = await Promise.all(
            lastCheckins
                .filter((record: any) => {
                    const lastDate = new Date(record.lastCheckin);
                    return lastDate < cutoffDate;
                })
                .map(async (record: any) => {
                    const person = await Person.findByPk(record.studentId, {
                        attributes: ['id', 'name']
                    });

                    // Buscar créditos disponíveis
                    const credits = await Credit.sum('availableCredits', {
                        where: {
                            idCustomer: record.studentId,
                            status: 'valid',
                            expirationDate: { [Op.gte]: new Date() }
                        }
                    }) || 0;

                    const lastClassDate = new Date(record.lastCheckin);
                    const daysInactive = Math.floor(
                        (new Date().getTime() - lastClassDate.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return {
                        studentId: record.studentId,
                        name: person?.name || 'Desconhecido',
                        lastClassDate: lastClassDate.toISOString(),
                        daysInactive,
                        credits: Math.round(credits)
                    };
                })
        );

        return res.status(200).json({
            success: true,
            data: inactiveStudents.sort((a, b) => b.daysInactive - a.daysInactive)
        });

    } catch (error) {
        console.error('Erro ao buscar alunos inativos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar alunos inativos',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== ALUNOS EM RISCO ====================

export const getStudentsAtRisk = async (req: Request, res: Response): Promise<Response> => {
    try {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Alunos do mês atual
        const currentMonthStudents = await ClassStudent.findAll({
            attributes: [
                'studentId',
                [fn('COUNT', col('classId')), 'classCount']
            ],
            where: {
                checkin: { [Op.not]: null },
                createdAt: { [Op.between]: [currentMonth, now] }
            },
            group: ['studentId'],
            raw: true
        });

        // Alunos do mês anterior
        const lastMonthStudents = await ClassStudent.findAll({
            attributes: [
                'studentId',
                [fn('COUNT', col('classId')), 'classCount']
            ],
            where: {
                checkin: { [Op.not]: null },
                createdAt: { [Op.between]: [lastMonth, endLastMonth] }
            },
            group: ['studentId'],
            raw: true
        });

        const studentsAtRisk: any[] = [];

        // Comparar e identificar quedas
        for (const current of currentMonthStudents) {
            const currentData: any = current;
            const previous = lastMonthStudents.find(
                (s: any) => s.studentId === currentData.studentId
            );

            if (previous) {
                const previousData: any = previous;
                const currentCount = parseInt(currentData.classCount);
                const previousCount = parseInt(previousData.classCount);
                const dropPercentage = ((previousCount - currentCount) / previousCount) * 100;

                // Queda de 30% ou mais
                if (dropPercentage >= 30) {
                    const person = await Person.findByPk(currentData.studentId, {
                        attributes: ['id', 'name']
                    });

                    studentsAtRisk.push({
                        studentId: currentData.studentId,
                        name: person?.name || 'Desconhecido',
                        currentMonthClasses: currentCount,
                        lastMonthClasses: previousCount,
                        dropPercentage: Math.round(dropPercentage)
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            data: studentsAtRisk.sort((a, b) => b.dropPercentage - a.dropPercentage)
        });

    } catch (error) {
        console.error('Erro ao buscar alunos em risco:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar alunos em risco',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// Continua no próximo arquivo...