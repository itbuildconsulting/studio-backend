import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Transactions from '../models/Transaction.model'; // Importando o modelo de transações


export const getFilteredTransactions = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { studentId, createdAt, transactionId, page = 1, pageSize = 10 } = req.body;

        // Montar os critérios de busca dinamicamente
        const filters: any = {};

        if (studentId) {
            filters.studentId = studentId; // Busca exata por ID do estudante
        }

        if (createdAt) {
            filters.createdAt = { [Op.eq]: new Date(createdAt) }; // Busca exata por data
        }

        if (transactionId) {
            filters.transactionId = transactionId; // Busca exata por ID da transação
        }

        // Configurar paginação
        const limit = parseInt(pageSize, 10); // Número de registros por página
        const offset = (parseInt(page, 10) - 1) * limit; // Deslocamento

        // Busca no banco com os filtros e paginação
        const { rows: transactions, count: totalRecords } = await Transactions.findAndCountAll({
            where: filters,
            attributes: ['transactionId', 'amount', 'studentId', 'status', 'createdAt'], // Seleciona apenas os campos necessários
            order: [['createdAt', 'DESC']], // Ordena pelas transações mais recentes
            limit,
            offset,
        });

        // Formata os dados
        const formattedTransactions = transactions.map(transaction => ({
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            studentId: transaction.studentId,
            status: transaction.status,
            createdAt: new Date(transaction.createdAt).toLocaleDateString('pt-BR'), // Formata a data
        }));

        // Retorna o resultado com paginação
        return res.status(200).json({
            success: true,
            data: formattedTransactions,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: parseInt(page, 10),
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar transações',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
};


export const getTransactionById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { transactionId } = req.params;

        // Retrieve transaction details by primary key (transactionId)
        const transaction = await Transactions.findByPk(transactionId);

        // If transaction not found, return 404 response
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transação não encontrada',
            });
        }

        // Format created and updated dates
        const transactionDetails = {
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            status: transaction.status,
            transactionType: transaction.transactionType,
            transactionCode: transaction.transactionCode,
            balance: transaction.balance,
            currency: transaction.currency,
            payment_method: transaction.payment_method,
            closed: transaction.closed,
            customerId: transaction.customerId,
            customerName: transaction.customerName,
            customerEmail: transaction.customerEmail,
            customerDocument: transaction.customerDocument,
            createdAt: new Date(transaction.createdAt).toLocaleDateString('pt-BR'),
            updatedAt: new Date(transaction.updatedAt).toLocaleDateString('pt-BR'),
            closedAt: transaction.closedAt ? new Date(transaction.closedAt).toLocaleDateString('pt-BR') : null,
        };

        // Return transaction details in the response
        return res.status(200).json({
            success: true,
            transaction: transactionDetails,
        });
    } catch (error) {
        console.error('Erro ao buscar transação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar transação',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
};