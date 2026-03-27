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

        const dateRange = {
            [Op.between]: [
                startDate ? new Date(startDate) : startOfWeek(new Date()),
                endDate ? new Date(endDate) : endOfWeek(new Date()),
            ],
        };

        const attendance = await ClassStudent.findAll({
            attributes: [
                [fn('DAYOFWEEK', col('Class.date')), 'dayOfWeek'],   // ✅ usa a data da AULA
                [fn('COUNT', col('ClassStudent.studentId')), 'attendanceCount'],
            ],
            include: [
                {
                    model: Class,
                    attributes: [],                                    // ✅ só precisa do date
                    where: {
                        date: dateRange,                               // ✅ filtra pela data da aula
                    },
                    required: true,
                },
            ],
            where: {
                status: true,                                          // ✅ só inscrições ativas
            },
            group: [fn('DAYOFWEEK', col('Class.date'))],
            order: [[fn('DAYOFWEEK', col('Class.date')), 'ASC']],
            raw: true,
        });

        const formattedAttendance = attendance.map((entry: any) => ({
            dayOfWeek: parseInt(entry.dayOfWeek),
            attendanceCount: parseInt(entry.attendanceCount),
        }));

        return res.status(200).json({ success: true, data: formattedAttendance });
    } catch (error) {
        console.error('Erro ao buscar frequência:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar frequência dos alunos',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
};


// PATCH para src/controllers/dashboardController.ts
// Substituir o bloco do getMonthlySales:

export const getMonthlySales = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { year } = req.body;

        const currentYear = year || new Date().getFullYear();

        const sales = await Transactions.findAll({
            attributes: [
                [fn('MONTH', col('createdAt')), 'month'],
                [fn('SUM', col('amount')), 'totalSales'],
            ],
            where: {                                          // ✅ DESCOMENTADO
                createdAt: {
                    [Op.between]: [
                        new Date(`${currentYear}-01-01`),
                        new Date(`${currentYear}-12-31`),
                    ],
                },
                status: 'paid',                             // ✅ só transações pagas
            },
            group: [fn('MONTH', col('createdAt'))],
            order: [[literal('month'), 'ASC']],
        });

        const formattedSales = sales.map((entry: any) => ({
            month: parseInt(entry.get('month')),
            totalSales: parseFloat(entry.get('totalSales')),
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
            attributes: ['id', 'time', 'productTypeId', 'date'], // Atributos principais
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
                const productTypeId = cls.get('productTypeId'); // ✅ usa .get() para garantir o valor
                const classId = cls.get('id');

                const location = productTypeId              // ✅ guard: só chama se existir
                    ? await getLocation(productTypeId)
                    : 'Local não especificado';

                const studentCount = classId
                    ? await getStudentCount(classId)
                    : 0;

                return {
                    id: classId,
                    time: cls.get('time'),
                    productTypeId,
                    location,
                    studentCount,
                    classDate: cls.get('date'),
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