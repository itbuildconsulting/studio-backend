import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import ClassStudent from '../models/ClassStudent.model'; // Ajuste o caminho do modelo
import { startOfWeek, endOfWeek } from 'date-fns';
import Transactions from '../models/Transaction.model';
import Product from '../models/Product.model';
import ProductType from '../models/ProductType.model';
import Place from '../models/Place.model';
import Class from '../models/Class.model';

export const getStudentAttendance = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { startDate, endDate } = req.body;

        // Determinar o intervalo de datas
        let dateRange = {
            [Op.between]: [
                startDate ? new Date(startDate) : startOfWeek(new Date()), // Início da semana ou data fornecida
                endDate ? new Date(endDate) : endOfWeek(new Date()), // Fim da semana ou data fornecida
            ],
        };

        // Consultar a tabela classStudent para calcular a frequência
        const attendance = await ClassStudent.findAll({
            attributes: [
                [fn('DAYOFWEEK', col('createdAt')), 'dayOfWeek'], // Extrai o dia da semana
                [fn('COUNT', col('studentId')), 'attendanceCount'], // Conta as presenças por dia
            ],
            where: {
                createdAt: dateRange, // Filtrar pelo intervalo de datas
            },
            group: [fn('DAYOFWEEK', col('createdAt'))], // Agrupa por dia da semana
            order: [fn('DAYOFWEEK', col('createdAt'))], // Ordena pelo dia da semana
        });

        // Formatar a resposta
        const formattedAttendance = attendance.map((entry: any) => ({
            dayOfWeek: parseInt(entry.get('dayOfWeek')), // Dia da semana como número
            attendanceCount: parseInt(entry.get('attendanceCount')), // Total de presenças
        }));

        return res.status(200).json({
            success: true,
            data: formattedAttendance,
        });
    } catch (error) {
        console.error('Erro ao buscar frequência:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar frequência dos alunos',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
};


export const getMonthlySales = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { year } = req.body;

        // Verifica se o ano foi fornecido, caso contrário, utiliza o ano atual
        const currentYear = year || new Date().getFullYear();

        // Consulta a tabela Transactions para calcular as vendas mensais
        const sales = await Transactions.findAll({
            attributes: [
                [fn('MONTH', col('createdAt')), 'month'], // Extrai o mês da data
                [fn('SUM', col('amount')), 'totalSales'], // Soma o total de vendas por mês
            ],
            /*where: {
                createdAt: {
                    [Op.between]: [
                        new Date(`${currentYear}-01-01`), // Início do ano
                        new Date(`${currentYear}-12-31`), // Fim do ano
                    ],
                },
                status: 'paid', // Considere apenas vendas concluídas (opcional)
            },*/
            group: [fn('MONTH', col('createdAt'))], // Agrupa por mês
            order: [[literal('month'), 'ASC']], // Ordena os resultados pelos meses
        });

        // Formata o resultado
        const formattedSales = sales.map((entry: any) => ({
            month: parseInt(entry.get('month')), // Número do mês (1 = Janeiro, 2 = Fevereiro, etc.)
            totalSales: parseFloat(entry.get('totalSales')), // Soma total de vendas no mês
        }));

        return res.status(200).json({
            success: true,
            year: currentYear,
            data: formattedSales,
        });
    } catch (error) {
        console.error('Erro ao buscar vendas mensais:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar vendas mensais',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
};

// Função para buscar a localização com base no productId
const getLocation = async (productType: string): Promise<string> => {
    // Busca o placeId associado ao productType
    const product = await ProductType.findOne({
        where: { id: productType },
        attributes: ['placeId'],
    });

    if (!product) {
        return 'Local não encontrado';
    }

    // Usa o placeId para buscar o nome do local
    const place = await Place.findOne({
        where: { id: product.placeId },
        attributes: ['name'], // Obtém apenas a localização
    });

    return place?.name || 'Local não especificado';
};

// Função para contar o número de alunos em uma aula
const getStudentCount = async (classId: number): Promise<number> => {
    return await ClassStudent.count({
        where: { classId },
    });
};


// Controller principal
export const getClassesForNextDays = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Determinar o intervalo de datas (hoje até 3 dias no futuro)
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);

        // Buscar as aulas no intervalo de datas
        const classes = await Class.findAll({
            attributes: ['id', 'time', 'productType', 'date'], // Atributos principais
            where: {
                date: {
                    [Op.between]: [today, threeDaysFromNow],
                },
            },
            order: [['date', 'ASC'], ['time', 'ASC']], // Ordenar por data e horário
        });

        // Processar cada aula e buscar os dados adicionais
        const formattedClasses = await Promise.all(
            classes.map(async (cls: any) => {
                const location = await getLocation(cls.productType); // Buscar localização
                const studentCount = await getStudentCount(cls.id); // Contar alunos

                return {
                    id: cls.id,
                    time: cls.time,
                    productType: cls.productType,
                    location,
                    studentCount,
                    classDate: cls.date,
                };
            })
        );

        // Agrupar as aulas por data
        const groupedClasses: Record<string, any[]> = {};

        formattedClasses.forEach((cls: { classDate: { toISOString: () => string; }; }) => {
            const day = cls.classDate.toISOString().split('T')[0]; // Data no formato YYYY-MM-DD
            if (!groupedClasses[day]) {
                groupedClasses[day] = [];
            }
            groupedClasses[day].push(cls);
        });

        return res.status(200).json({
            success: true,
            data: groupedClasses,
        });
    } catch (error) {
        console.error('Erro ao buscar aulas:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar aulas',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
};