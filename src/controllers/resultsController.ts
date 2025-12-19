import { Request, Response } from 'express';
import { Op, fn, col, literal, WhereOptions } from 'sequelize';
import Transactions from '../models/Transaction.model';

// Obter métricas financeiras (KPIs)
export const getFinancialMetrics = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { startDate, endDate } = req.body;

        // Definir período padrão (mês atual)
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const start = startDate ? new Date(startDate) : firstDayCurrentMonth;
        const end = endDate ? new Date(endDate) : now;

        // Criar where conditions com tipo correto
        const currentWhere: WhereOptions = {
            createdAt: {
                [Op.between]: [start, end]
            }
        };

        const previousWhere: WhereOptions = {
            createdAt: {
                [Op.between]: [firstDayLastMonth, lastDayLastMonth]
            }
        };

        // Buscar métricas do período atual
        const currentMetrics = await Transactions.findAll({
            where: currentWhere,
            attributes: [
                [fn('COUNT', col('transactionId')), 'totalTransactions'],
                [fn('SUM', col('amount')), 'totalRevenue'],
                [fn('AVG', col('amount')), 'averageTicket'],
                [
                    literal(`SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)`),
                    'successfulTransactions'
                ]
            ],
            raw: true
        });

        // Buscar métricas do período anterior (para comparação)
        const previousMetrics = await Transactions.findAll({
            where: previousWhere,
            attributes: [
                [fn('COUNT', col('transactionId')), 'totalTransactions'],
                [fn('SUM', col('amount')), 'totalRevenue'],
            ],
            raw: true
        });

        const current: any = currentMetrics[0];
        const previous: any = previousMetrics[0];

        const totalTransactions = parseInt(current.totalTransactions || 0);
        const totalRevenue = parseFloat(current.totalRevenue || 0);
        const averageTicket = parseFloat(current.averageTicket || 0);
        const successfulTransactions = parseInt(current.successfulTransactions || 0);
        const successRate = totalTransactions > 0 
            ? (successfulTransactions / totalTransactions) * 100 
            : 0;

        // Calcular crescimento
        const previousRevenue = parseFloat(previous?.totalRevenue || 0);
        const previousTransactions = parseInt(previous?.totalTransactions || 0);

        const revenueGrowth = previousRevenue > 0 
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
            : 0;

        const transactionsGrowth = previousTransactions > 0 
            ? ((totalTransactions - previousTransactions) / previousTransactions) * 100 
            : 0;

        return res.status(200).json({
            success: true,
            totalRevenue: Math.round(totalRevenue),
            totalTransactions,
            successRate: parseFloat(successRate.toFixed(2)),
            averageTicket: Math.round(averageTicket),
            revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
            transactionsGrowth: parseFloat(transactionsGrowth.toFixed(2))
        });

    } catch (error) {
        console.error('Erro ao buscar métricas financeiras:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar métricas financeiras',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// Obter receita ao longo do tempo
export const getRevenueOverTime = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { period = 'month', startDate, endDate } = req.body;

        const now = new Date();
        let start: Date;
        let groupFormat: string;
        let labelFormat: (date: Date) => string;

        // Definir período e formato
        switch (period) {
            case 'week':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                groupFormat = '%Y-%m-%d';
                labelFormat = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                groupFormat = '%Y-%m';
                labelFormat = (date) => date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                break;
            case 'month':
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                groupFormat = '%Y-%m-%d';
                labelFormat = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                break;
        }

        if (startDate) start = new Date(startDate);
        const end = endDate ? new Date(endDate) : now;

        // Criar where condition com tipo correto
        const whereCondition: WhereOptions = {
            createdAt: { 
                [Op.between]: [start, end] 
            },
            status: 'paid'
        };

        // Buscar receita agrupada
        const revenueData = await Transactions.findAll({
            where: whereCondition,
            attributes: [
                [fn('DATE', col('createdAt')), 'date'],
                [fn('SUM', col('amount')), 'revenue']
            ],
            group: [fn('DATE', col('createdAt'))],
            order: [[fn('DATE', col('createdAt')), 'ASC']],
            raw: true
        });

        const labels: string[] = [];
        const data: number[] = [];

        revenueData.forEach((item: any) => {
            const date = new Date(item.date);
            labels.push(labelFormat(date));
            data.push(parseFloat(item.revenue) / 100); // Converter centavos para reais
        });

        return res.status(200).json({
            success: true,
            labels,
            data
        });

    } catch (error) {
        console.error('Erro ao buscar receita ao longo do tempo:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar receita ao longo do tempo',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// Obter distribuição por forma de pagamento
export const getPaymentMethodDistribution = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { startDate, endDate } = req.body;

        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : now;

        // Criar where condition com tipo correto
        const whereCondition: WhereOptions = {
            createdAt: { 
                [Op.between]: [start, end] 
            },
            status: 'paid'
        };

        const distribution = await Transactions.findAll({
            where: whereCondition,
            attributes: [
                'payment_method',
                [fn('COUNT', col('transactionId')), 'count']
            ],
            group: ['payment_method'],
            raw: true
        });

        const totalTransactions = distribution.reduce((sum: number, item: any) => 
            sum + parseInt(item.count), 0
        );

        const result = distribution.map((item: any) => ({
            method: formatPaymentMethod(item.payment_method),
            count: parseInt(item.count),
            percentage: parseFloat(((parseInt(item.count) / totalTransactions) * 100).toFixed(2))
        }));

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Erro ao buscar distribuição de pagamento:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar distribuição de pagamento',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// Obter transações por status
export const getTransactionsByStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { startDate, endDate } = req.body;

        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : now;

        // Criar where condition com tipo correto
        const whereCondition: WhereOptions = {
            createdAt: { 
                [Op.between]: [start, end] 
            }
        };

        const statusData = await Transactions.findAll({
            where: whereCondition,
            attributes: [
                'status',
                [fn('COUNT', col('transactionId')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const totalTransactions = statusData.reduce((sum: number, item: any) => 
            sum + parseInt(item.count), 0
        );

        const result = statusData.map((item: any) => ({
            status: item.status,
            count: parseInt(item.count),
            percentage: parseFloat(((parseInt(item.count) / totalTransactions) * 100).toFixed(2))
        }));

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Erro ao buscar transações por status:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar transações por status',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};

// Função auxiliar para formatar nomes de métodos de pagamento
function formatPaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito',
        'pix': 'PIX',
        'boleto': 'Boleto',
        'bank_transfer': 'Transferência',
    };
    return methods[method] || method;
}