import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import Person from '../models/Person.model';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';
import Credit from '../models/Credit.model';
import Product from '../models/Product.model';
import { getPresenceFilter } from '../utils/presenceFilter';
import Transactions from '../models/Transaction.model';
import Item from '../models/Item.model';

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
            group: ['time'],
            order: [['time', 'ASC']],
            raw: true
        });

        const presenceFilter = await getPresenceFilter();
        const labels: string[] = [];
        const counts: number[] = [];  // nº alunos por horário
        const spots: number[] = [];   // vagas totais (aulas × 12 bikes)
        const data: number[] = [];    // % ocupação

        for (const timeSlot of occupancyByTime) {
            const timeSlotData: any = timeSlot;
            const time: any = timeSlotData.time;
            const totalClasses = parseInt(timeSlotData.totalClasses);

            const checkins = await ClassStudent.count({
                include: [{
                    model: Class,
                    where: { time, date: { [Op.between]: [start, end] }, active: true },
                    attributes: []
                }],
                where: presenceFilter
            });

            const totalSpots = totalClasses * 12;
            const occupancyRate = totalSpots > 0 ? (checkins / totalSpots) * 100 : 0;

            // Remove os segundos do formato HH:MM:SS → HH:MM
            labels.push(String(time).slice(0, 5));
            counts.push(checkins);
            spots.push(totalSpots);
            data.push(parseFloat(occupancyRate.toFixed(1)));
        }

        return res.status(200).json({
            success: true,
            data: { labels, counts, spots, data }
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

                const presenceFilter = await getPresenceFilter();
                const totalCheckins = await ClassStudent.count({
                    where: {
                        classId: { [Op.in]: classIds },
                        ...presenceFilter
                    }
                });

                const totalSpots = classIds.length * 12;
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

        const presenceFilter = await getPresenceFilter();

        const occupancyByDay = await ClassStudent.findAll({
            attributes: [
                [fn('DAYOFWEEK', col('Class.date')), 'dayOfWeek'],
                [fn('COUNT', col('ClassStudent.id')), 'checkins']
            ],
            include: [{
                model: Class,
                attributes: [],
                where: { date: { [Op.between]: [firstDayMonth, now] } },
                required: true
            }],
            where: presenceFilter,
            group: [fn('DAYOFWEEK', col('Class.date'))],
            order: [[fn('DAYOFWEEK', col('Class.date')), 'ASC']],
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

// ==================== TENDÊNCIAS POR DIA ====================

export const getWeeklyTrends = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { startDate, endDate, period } = req.body;
        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const start = startDate ? new Date(startDate) : firstDayMonth;
        const end = endDate ? new Date(endDate) : now;
        const presenceFilter = await getPresenceFilter();
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        if (!period || period === 'hoje' || period === 'semana') {
            // Agrupa por dia da semana (Dom-Sáb), somando alunos no período
            const byDow = await ClassStudent.findAll({
                attributes: [
                    [fn('DAYOFWEEK', col('Class.date')), 'dow'],
                    [fn('COUNT', col('ClassStudent.id')), 'students']
                ],
                include: [{
                    model: Class,
                    attributes: [],
                    where: { date: { [Op.between]: [start, end] } },
                    required: true
                }],
                where: presenceFilter,
                group: [fn('DAYOFWEEK', col('Class.date'))],
                order: [[fn('DAYOFWEEK', col('Class.date')), 'ASC']],
                raw: true
            });

            const data = [0, 0, 0, 0, 0, 0, 0];
            byDow.forEach((row: any) => {
                const idx = parseInt(row.dow) - 1;
                data[idx] = parseInt(row.students);
            });

            return res.status(200).json({
                success: true,
                data: { labels: dayNames, data }
            });
        }

        // mes / trimestre — cada data real com aulas
        const byDate = await ClassStudent.findAll({
            attributes: [
                [fn('DATE', col('Class.date')), 'classDate'],
                [fn('COUNT', col('ClassStudent.id')), 'students']
            ],
            include: [{
                model: Class,
                attributes: [],
                where: { date: { [Op.between]: [start, end] } },
                required: true
            }],
            where: presenceFilter,
            group: [fn('DATE', col('Class.date'))],
            order: [[fn('DATE', col('Class.date')), 'ASC']],
            raw: true
        });

        const labels: string[] = [];
        const data: number[] = [];

        byDate.forEach((row: any) => {
            const d = new Date(row.classDate);
            labels.push(
                `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
            );
            data.push(parseInt(row.students));
        });

        return res.status(200).json({
            success: true,
            data: { labels, data }
        });

    } catch (error) {
        console.error('Erro ao buscar tendências por dia:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar tendências por dia',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// ==================== AULAS E ALUNOS POR MÊS ====================
// Relatório mensal: número de aulas (excluindo canceladas) e total de
// presenças/matrículas (excluindo as canceladas) por mês — não é aluno
// único, é a soma de alunos em todas as aulas do mês.

export const getClassesAndStudentsByMonth = async (req: Request, res: Response): Promise<Response> => {
    try {
        const months = parseInt(req.query.months as string) || 12;
        const now = new Date();
        const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
        const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const presenceFilter = await getPresenceFilter();

        // Aulas por mês — só conta aulas ativas (não canceladas)
        const classesByMonth = await Class.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
                [fn('COUNT', col('id')), 'classCount'],
            ],
            where: {
                date: { [Op.between]: [rangeStart, rangeEnd] },
                active: true,
            },
            group: [fn('DATE_FORMAT', col('date'), '%Y-%m')],
            raw: true,
        });

        // Total de presenças por mês (soma de alunos em todas as aulas, não
        // únicos) — exclui matrículas canceladas (status=false) e aulas
        // canceladas (active=false, que já zera o status da matrícula)
        const studentsByMonth = await ClassStudent.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('Class.date'), '%Y-%m'), 'month'],
                [fn('COUNT', col('ClassStudent.id')), 'studentCount'],
            ],
            include: [{
                model: Class,
                attributes: [],
                where: {
                    date: { [Op.between]: [rangeStart, rangeEnd] },
                    active: true,
                },
                required: true,
            }],
            where: presenceFilter,
            group: [fn('DATE_FORMAT', col('Class.date'), '%Y-%m')],
            raw: true,
        });

        const classMap = new Map<string, number>();
        (classesByMonth as any[]).forEach((r) => classMap.set(r.month, parseInt(r.classCount, 10)));

        const studentMap = new Map<string, number>();
        (studentsByMonth as any[]).forEach((r) => studentMap.set(r.month, parseInt(r.studentCount, 10)));

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const data = [];
        for (let i = 0; i < months; i++) {
            const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            data.push({
                month: key,
                label: `${monthNames[d.getMonth()]}/${d.getFullYear()}`,
                classCount: classMap.get(key) ?? 0,
                studentCount: studentMap.get(key) ?? 0,
            });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Erro ao buscar aulas e alunos por mês:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar aulas e alunos por mês',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
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

export const getMonthlyComparison = async (req: Request, res: Response): Promise<Response> => {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const paidTx = await Transactions.findAll({
            where: { status: 'paid', createdAt: { [Op.between]: [monthStart, monthEnd] } },
            attributes: ['amount'],
            raw: true,
        });

        const totalCents   = paidTx.reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
        const mrr          = totalCents / 100;
        const averageTicket = paidTx.length > 0 ? mrr / paidTx.length : 0;

        const [totalCount, overdueCount] = await Promise.all([
            Transactions.count({ where: { createdAt: { [Op.between]: [monthStart, monthEnd] } } }),
            Transactions.count({ where: { status: { [Op.in]: ['waiting_payment', 'refused', 'chargeback', 'pending_refund'] }, createdAt: { [Op.between]: [monthStart, monthEnd] } } }),
        ]);

        const delinquencyRate = totalCount > 0 ? Math.round((overdueCount / totalCount) * 100) : 0;

        return res.status(200).json({ success: true, mrr, averageTicket, delinquencyRate });
    } catch (error) {
        console.error('Erro ao buscar comparação mensal:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar comparação mensal',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
};
// ==================== TICKET MÉDIO POR AULA ====================

export const getTicketPerClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const now = new Date();
        const fmt = (d: Date) => d.toISOString().split('T')[0];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

        // 1. Preço por crédito real — receita total (12 meses) ÷ créditos vendidos (12 meses)
        //    Exclui itens com amount = 0 (produtos teste, créditos promocionais/ilimitados gratuitos)
        const paidTxRows = await Transactions.findAll({
            where: { status: 'paid', createdAt: { [Op.gte]: twelveMonthsAgo } },
            attributes: ['transactionId'],
            raw: true,
        });

        const txIds = (paidTxRows as any[]).map(t => t.transactionId);
        let totalCreditsSold = 0;
        let totalPaidCents = 0;

        if (txIds.length > 0) {
            const paidItems = await Item.findAll({
                where: {
                    transactionId: { [Op.in]: txIds },
                    amount: { [Op.gt]: 0 },
                },
                attributes: ['itemId', 'quantity', 'amount'],
                raw: true,
            });

            const productIds = [...new Set((paidItems as any[]).map(i => i.itemId))];
            const products = await Product.findAll({
                where: {
                    id: { [Op.in]: productIds },
                    credit: { [Op.gt]: 0 },
                    value: { [Op.ne]: 10 }, // exclui produtos teste/ilimitados (preço fixo de R$10)
                },
                attributes: ['id', 'credit'],
                raw: true,
            });
            const creditMap = new Map((products as any[]).map(p => [p.id, p.credit]));

            for (const item of paidItems as any[]) {
                const credits = creditMap.get(item.itemId);
                if (!credits) continue;
                totalCreditsSold += item.quantity * credits;
                totalPaidCents   += item.amount;
            }
        }

        const totalPaid = totalPaidCents / 100;
        const pricePerCredit = totalCreditsSold > 0 ? totalPaid / totalCreditsSold : 0;

        // 2. Média de alunos por aula — últimos 30 dias, aulas ativas (query agregada)
        const classStudentCounts = await ClassStudent.findAll({
            attributes: [
                'classId',
                [fn('COUNT', col('ClassStudent.studentId')), 'count'],
            ],
            include: [{
                model: Class,
                attributes: [],
                where: { date: { [Op.between]: [fmt(thirtyDaysAgo), fmt(now)] }, active: true },
                required: true,
            }],
            where: { status: true },
            group: ['ClassStudent.classId'],
            raw: true,
        });

        let avgStudentsPerClass = 0;
        if ((classStudentCounts as any[]).length > 0) {
            const total = (classStudentCounts as any[]).reduce((s, r) => s + parseInt(r.count), 0);
            avgStudentsPerClass = total / (classStudentCounts as any[]).length;
        }

        const ticketPerClass = parseFloat((pricePerCredit * avgStudentsPerClass).toFixed(2));

        return res.status(200).json({
            success: true,
            data: {
                ticketPerClass,
                pricePerCredit: parseFloat(pricePerCredit.toFixed(2)),
                avgStudentsPerClass: parseFloat(avgStudentsPerClass.toFixed(1)),
                totalCreditsSold,
                periodMonths: 12,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao buscar ticket por aula', error: error instanceof Error ? error.message : error });
    }
};

// ==================== COMPRAS POR DIA DA SEMANA ====================

export const getPurchasesByWeekday = async (req: Request, res: Response): Promise<Response> => {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const transactions = await Transactions.findAll({
            where: { status: 'paid', createdAt: { [Op.gte]: monthStart } },
            attributes: ['createdAt', 'amount'],
            raw: true,
        });

        const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const counts = Array(7).fill(0);
        const amounts = Array(7).fill(0);

        for (const t of transactions as any[]) {
            const day = new Date(t.createdAt).getDay();
            counts[day]++;
            amounts[day] += (t.amount ?? 0) / 100;
        }

        const data = DAYS.map((label, i) => ({ label, count: counts[i], amount: amounts[i] }));
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao buscar compras por dia', error: error instanceof Error ? error.message : error });
    }
};

// ==================== INTERVALO MÉDIO ENTRE COMPRAS ====================

export const getRepurchaseInterval = async (req: Request, res: Response): Promise<Response> => {
    try {
        const transactions = await Transactions.findAll({
            where: { status: 'paid', studentId: { [Op.not]: null } },
            attributes: ['studentId', 'createdAt'],
            order: [['studentId', 'ASC'], ['createdAt', 'ASC']],
            raw: true,
        });

        const byStudent: Record<number, Date[]> = {};
        for (const t of transactions as any[]) {
            if (!byStudent[t.studentId]) byStudent[t.studentId] = [];
            byStudent[t.studentId].push(new Date(t.createdAt));
        }

        const gaps: number[] = [];
        for (const dates of Object.values(byStudent)) {
            for (let i = 1; i < dates.length; i++) {
                const days = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
                gaps.push(days);
            }
        }

        const avgDays = gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
        return res.status(200).json({ success: true, data: { avgDays, sampleSize: gaps.length } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao calcular intervalo de recompra', error: error instanceof Error ? error.message : error });
    }
};

// ==================== COMPRARAM VS. USARAM ====================

export const getBoughtVsUsed = async (req: Request, res: Response): Promise<Response> => {
    try {
        const [bought, used] = await Promise.all([
            Transactions.count({ col: 'studentId', distinct: true, where: { status: 'paid', studentId: { [Op.not]: null } } }),
            ClassStudent.count({ col: 'studentId', distinct: true, where: { status: true } }),
        ]);

        return res.status(200).json({ success: true, data: { bought, used, notUsed: Math.max(0, bought - used) } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao buscar compraram vs. usaram', error: error instanceof Error ? error.message : error });
    }
};

// ==================== RECEITA ACUMULADA MÊS ATUAL VS. ANTERIOR ====================

export const getCumulativeRevenue = async (req: Request, res: Response): Promise<Response> => {
    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();

        const currentStart = new Date(y, m, 1);
        const currentEnd   = new Date(y, m + 1, 0, 23, 59, 59);
        const prevStart    = new Date(y, m - 1, 1);
        const prevEnd      = new Date(y, m, 0, 23, 59, 59);

        const fetchDailyAmounts = async (start: Date, end: Date) => {
            const rows = await Transactions.findAll({
                where: { status: 'paid', createdAt: { [Op.between]: [start, end] } },
                attributes: [
                    [fn('DAY', col('createdAt')), 'day'],
                    [fn('SUM', col('amount')), 'total'],
                ],
                group: [fn('DAY', col('createdAt'))],
                order: [[fn('DAY', col('createdAt')), 'ASC']],
                raw: true,
            });
            const daysInMonth = end.getDate();
            const map: Record<number, number> = {};
            for (const r of rows as any[]) map[parseInt(r.day)] = parseFloat(r.total) / 100;
            let cumulative = 0;
            return Array.from({ length: daysInMonth }, (_, i) => {
                cumulative += map[i + 1] ?? 0;
                return parseFloat(cumulative.toFixed(2));
            });
        };

        const [current, previous] = await Promise.all([
            fetchDailyAmounts(currentStart, currentEnd),
            fetchDailyAmounts(prevStart, prevEnd),
        ]);

        const days = Array.from({ length: Math.max(current.length, previous.length) }, (_, i) => i + 1);
        return res.status(200).json({ success: true, data: { days, current, previous } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao buscar receita acumulada', error: error instanceof Error ? error.message : error });
    }
};

// ==================== PRODUTOS MAIS COMPRADOS ====================

export const getMostPurchasedProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
        const months = parseInt(req.query.months as string) || 6;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const showInactive = req.query.showInactive === 'true';

        const whereItem: any = { created_at: { [Op.gte]: startDate } };

        if (!showInactive) {
            const inactiveProducts = await Product.findAll({
                where: { active: 0 },
                attributes: ['name'],
                raw: true,
            });
            const inactiveNames = (inactiveProducts as any[]).map((p) => p.name);
            if (inactiveNames.length > 0) {
                whereItem.description = { [Op.notIn]: inactiveNames };
            }
        }

        const rows = await Item.findAll({
            attributes: [
                'itemId',
                'description',
                [fn('COUNT', col('Item.id')), 'purchaseCount'],
                [fn('SUM', col('quantity')), 'totalQuantity'],
            ],
            where: whereItem,
            group: ['itemId', 'description'],
            order: [[fn('COUNT', col('Item.id')), 'DESC']],
            limit: 10,
            raw: true,
        });

        const data = (rows as any[]).map((r) => ({
            productId: r.itemId,
            name: r.description,
            purchaseCount: parseInt(r.purchaseCount),
            totalQuantity: parseInt(r.totalQuantity),
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao buscar produtos mais comprados', error: error instanceof Error ? error.message : error });
    }
};

// ==================== COMPRADORES POR PRODUTO ====================

export const getProductBuyers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { productId, months } = req.query;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'productId é obrigatório.' });
        }

        // Período opcional
        const whereTransaction: any = { status: 'paid' };
        if (months) {
            const since = new Date();
            since.setMonth(since.getMonth() - Number(months));
            whereTransaction.createdAt = { [Op.gte]: since };
        }

        // Transações pagas no período
        const paidTxRows = await Transactions.findAll({
            where: whereTransaction,
            attributes: ['transactionId'],
            raw: true,
        });
        const txIds = (paidTxRows as any[]).map(t => t.transactionId);

        if (txIds.length === 0) {
            return res.status(200).json({ success: true, data: { product: null, buyers: [], totalBuyers: 0, totalPurchases: 0 } });
        }

        // Produto
        const product = await Product.findByPk(Number(productId), { attributes: ['id', 'name', 'credit', 'value'], raw: true });

        // Itens desse produto nessas transações (exclui gratuitos e produtos R$10)
        const items = await Item.findAll({
            where: {
                transactionId: { [Op.in]: txIds },
                itemId: Number(productId),
                amount: { [Op.gt]: 0 },
            },
            attributes: ['studentId', 'quantity', 'amount', 'created_at'],
            raw: true,
        });

        // Agrupa por studentId
        const buyerMap = new Map<number, { quantity: number; purchases: number; lastDate: Date | null }>();
        for (const item of items as any[]) {
            const sid = item.studentId;
            if (!sid) continue;
            const existing = buyerMap.get(sid) ?? { quantity: 0, purchases: 0, lastDate: null };
            existing.quantity  += item.quantity ?? 1;
            existing.purchases += 1;
            const d = item.created_at ? new Date(item.created_at) : null;
            if (d && (!existing.lastDate || d > existing.lastDate)) existing.lastDate = d;
            buyerMap.set(sid, existing);
        }

        // Enriquece com nomes
        const studentIds = [...buyerMap.keys()];
        const persons = await Person.findAll({
            where: { id: { [Op.in]: studentIds } },
            attributes: ['id', 'name', 'email'],
            raw: true,
        });
        const personMap = new Map((persons as any[]).map(p => [p.id, p]));

        const buyers = [...buyerMap.entries()]
            .map(([sid, stats]) => ({
                studentId:   sid,
                studentName: personMap.get(sid)?.name  ?? '—',
                studentEmail:personMap.get(sid)?.email ?? '—',
                purchases:   stats.purchases,
                totalCredits:stats.quantity,
                lastPurchase:stats.lastDate,
            }))
            .sort((a, b) => b.purchases - a.purchases);

        return res.status(200).json({
            success: true,
            data: {
                product,
                buyers,
                totalBuyers:   buyers.length,
                totalPurchases:buyers.reduce((s, b) => s + b.purchases, 0),
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao buscar compradores por produto', error: error instanceof Error ? error.message : error });
    }
};

// ==================== CLIENTES EXCLUSIVOS DE PRODUTO(S) ====================
// Antes fixo em "aula experimental" (nome do produto), agora aceita uma lista
// dinâmica de productIds via query string, já que o produto-alvo do relatório
// muda com o tempo (hoje é a aula experimental, amanhã pode ser outro).

export const getTrialNoConversion = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { productIds } = req.query;

        let targetIds: number[];

        if (productIds) {
            // Filtro dinâmico: produtos escolhidos pelo usuário no relatório
            targetIds = String(productIds)
                .split(',')
                .map((id) => parseInt(id, 10))
                .filter((id) => !isNaN(id));
        } else {
            // Compatibilidade: sem filtro explícito, cai no comportamento antigo
            // (produtos cujo nome contém "experimental")
            const trialProducts = await Product.findAll({
                where: {
                    name: { [Op.like]: '%experimental%' }
                },
                attributes: ['id'],
                raw: true,
            });
            targetIds = trialProducts.map((p: any) => p.id);
        }

        if (targetIds.length === 0) {
            return res.json({ success: true, data: [], meta: { total: 0 } });
        }

        // 2. Alunos que compraram algum dos produtos selecionados (transação paga)
        const trialItems = await Item.findAll({
            where: { itemId: { [Op.in]: targetIds } },
            include: [{ model: Transactions, as: 'transaction', where: { status: 'paid' }, required: true }],
            attributes: ['studentId'],
            raw: true,
        });

        const trialStudentIds = [...new Set(trialItems.map((i: any) => i.studentId).filter(Boolean))] as number[];

        if (trialStudentIds.length === 0) {
            return res.json({ success: true, data: [], meta: { total: 0 } });
        }

        // 3. Alunos que também compraram outros produtos (fora da seleção)
        const convertedItems = await Item.findAll({
            where: {
                studentId: { [Op.in]: trialStudentIds },
                itemId: { [Op.notIn]: targetIds },
            },
            include: [{ model: Transactions, as: 'transaction', where: { status: 'paid' }, required: true }],
            attributes: ['studentId'],
            raw: true,
        });

        const convertedIds = new Set(convertedItems.map((i: any) => i.studentId));

        // 4. Exclusivos = compraram só os produtos selecionados
        const nonConvertedIds = trialStudentIds.filter(id => !convertedIds.has(id));

        if (nonConvertedIds.length === 0) {
            return res.json({ success: true, data: [], meta: { total: 0 } });
        }

        // 5. Busca dados das pessoas
        const persons = await Person.findAll({
            where: { id: { [Op.in]: nonConvertedIds } },
            attributes: ['id', 'name', 'email', 'phone'],
            order: [['name', 'ASC']],
            raw: true,
        });

        return res.json({
            success: true,
            data: persons,
            meta: { total: persons.length },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao buscar alunos sem conversão', error: error instanceof Error ? error.message : error });
    }
};
