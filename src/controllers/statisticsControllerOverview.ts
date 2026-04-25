import { Request, Response } from 'express';
import { Op, fn, col } from 'sequelize';
import Person from '../models/Person.model';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';
import Credit from '../models/Credit.model';
import { getPresenceFilter } from '../utils/presenceFilter';

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

        const presenceFilter = await getPresenceFilter();

        // Alunos ativos (pelo menos 1 presença confirmada no período)
        const activeStudentsCount = await ClassStudent.count({
            distinct: true,
            col: 'studentId',
            where: {
                ...presenceFilter,
                createdAt: { [Op.between]: [start, end] }
            }
        });

        // Alunos ativos no mês anterior
        const previousActiveStudentsCount = await ClassStudent.count({
            distinct: true,
            col: 'studentId',
            where: {
                ...presenceFilter,
                createdAt: { [Op.between]: [firstDayLastMonth, lastDayLastMonth] }
            }
        });

        const activeStudentsGrowth = previousActiveStudentsCount > 0
            ? ((activeStudentsCount - previousActiveStudentsCount) / previousActiveStudentsCount) * 100
            : 0;

        // Total de presenças no período
        const totalCheckins = await ClassStudent.count({
            where: {
                ...presenceFilter,
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

        const totalSpotsAvailable = totalClassesInPeriod * 12;
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

        const avgStudentsPerClass = totalClassesInPeriod > 0
            ? parseFloat((totalCheckins / totalClassesInPeriod).toFixed(1))
            : 0;

        return res.status(200).json({
            success: true,
            activeStudents: activeStudentsCount,
            activeStudentsGrowth: parseFloat(activeStudentsGrowth.toFixed(1)),
            avgStudentsPerClass,
            occupancyRate: parseFloat(occupancyRate.toString()),
            totalActiveCredits: Math.round(totalActiveCredits),
            creditsExpiringNext7Days: Math.round(creditsExpiringNext7Days),
            npsScore: 'N/A'
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

function resolvePeriodStart(period?: string): Date {
    const now = new Date();
    switch (period) {
        case 'hoje':
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        case 'semana': {
            const d = new Date(now);
            d.setDate(now.getDate() - 7);
            return d;
        }
        case 'trimestre': {
            const d = new Date(now);
            d.setMonth(now.getMonth() - 3);
            return d;
        }
        default:
            return new Date(now.getFullYear(), now.getMonth(), 1);
    }
}

export const getTopStudents = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { limit = 10, period } = req.body;
        const start = resolvePeriodStart(period);
        const presenceFilter = await getPresenceFilter();

        const now = new Date();

        // Dias distintos com aula no período — denominador da frequência
        const totalClassDays = await Class.count({
            distinct: true,
            col: 'date',
            where: {
                date: { [Op.between]: [start, now] },
                active: true
            }
        });

        // Últimos 7 dias com aula — compartilhado entre todos os alunos
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);

        const activeLast7 = await Class.findAll({
            attributes: ['date'],
            where: { date: { [Op.between]: [sevenDaysAgo, now] }, active: true },
            group: ['date'],
            raw: true
        });

        const toDateStr = (d: any) => new Date(d).toISOString().split('T')[0];
        const activeDaySet = new Set(activeLast7.map((c: any) => toDateStr(c.date)));

        // Buscar alunos com mais presenças confirmadas no período
        const topStudents = await ClassStudent.findAll({
            attributes: [
                'studentId',
                [fn('COUNT', col('ClassStudent.classId')), 'classCount'],
                [fn('COUNT', fn('DISTINCT', fn('DATE', col('Class.date')))), 'uniqueDays']
            ],
            include: [{
                model: Class,
                attributes: [],
                where: { date: { [Op.between]: [start, now] } },
                required: true
            }],
            where: presenceFilter,
            group: ['studentId'],
            order: [[fn('COUNT', col('ClassStudent.classId')), 'DESC']],
            limit: parseInt(limit.toString()),
            raw: true
        });

        // Enriquecer com dados do aluno
        const enrichedStudents = await Promise.all(
            topStudents.map(async (student: any) => {
                const studentData: any = student;
                const person = await Person.findByPk(studentData.studentId, {
                    attributes: ['id', 'name']
                });

                // Frequência = dias que o aluno compareceu / dias que o estúdio teve aula
                const uniqueDays = parseInt(studentData.uniqueDays || 0);
                const attendanceRate = totalClassDays > 0
                    ? Math.min(100, Math.round((uniqueDays / totalClassDays) * 100))
                    : 0;

                // Presença nos últimos 7 dias
                const studentLast7 = await ClassStudent.findAll({
                    attributes: [[fn('DATE', col('Class.date')), 'classDate']],
                    include: [{
                        model: Class,
                        attributes: [],
                        where: { date: { [Op.between]: [sevenDaysAgo, now] } },
                        required: true
                    }],
                    where: { studentId: studentData.studentId, ...presenceFilter },
                    group: [fn('DATE', col('Class.date'))],
                    raw: true
                });
                const studentDaySet = new Set(studentLast7.map((d: any) => toDateStr(d.classDate)));

                const last7 = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(sevenDaysAgo);
                    d.setDate(sevenDaysAgo.getDate() + i);
                    const dateStr = toDateStr(d);
                    if (!activeDaySet.has(dateStr)) return 'no_class';
                    return studentDaySet.has(dateStr) ? 'attended' : 'missed';
                });

                return {
                    studentId: studentData.studentId,
                    name: person?.name || 'Desconhecido',
                    classCount: parseInt(studentData.classCount),
                    attendanceRate,
                    last7
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
        const today = new Date();

        // Buscar a última aula de cada aluno (através do relacionamento Class)
        const studentsWithLastClass = await ClassStudent.findAll({
            attributes: [
                'studentId',
                [fn('MAX', col('Class.date')), 'lastClassDate']
            ],
            include: [{
                model: Class,
                attributes: [],
                where: {
                    date: { [Op.lt]: today } // Apenas aulas passadas
                },
                required: true
            }],
            group: ['studentId'],
            raw: true
        });

        // Filtrar apenas os inativos e enriquecer com dados
        const inactiveStudents = await Promise.all(
            studentsWithLastClass
                .filter((record: any) => {
                    const lastDate = new Date(record.lastClassDate);
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

                    const lastClassDate = new Date(record.lastClassDate);
                    const daysInactive = Math.floor(
                        (today.getTime() - lastClassDate.getTime()) / (1000 * 60 * 60 * 24)
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

        const presenceFilter = await getPresenceFilter();

        // Alunos do mês atual
        const currentMonthStudents = await ClassStudent.findAll({
            attributes: [
                'studentId',
                [fn('COUNT', col('classId')), 'classCount']
            ],
            where: {
                ...presenceFilter,
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
                ...presenceFilter,
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