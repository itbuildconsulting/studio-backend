import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Transactions from '../models/Transaction.model'; // Importando o modelo de transações
import Item from '../models/Item.model';


export const getFilteredTransactions = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { studentId, createdAt, transactionId, page = 1, pageSize = 10, customerName } = req.body;

        // Montar os critérios de busca dinamicamente
        const filters: any = {};

        if (customerName) {
            filters.customerName = customerName; // Busca exata por nome do estudante
        }

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
            attributes: ['transactionId', 'amount', 'studentId', 'status', 'createdAt', 'customerName', 'payment_method'], // Seleciona apenas os campos necessários
            order: [['createdAt', 'DESC']], // Ordena pelas transações mais recentes
            limit,
            offset,
        });

        // Formata os dados
        const formattedTransactions = transactions.map(transaction => ({
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            studentId: transaction.studentId,
            customerName: transaction.customerName,
            status: transaction.status,
            payment_method: transaction.payment_method,
            //createdAt: new Date(transaction.createdAt).toLocaleDateString('pt-BR'), // Formata a data
            createdAt: transaction.createdAt
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

        const transaction = await Transactions.findOne({
            where: { transactionId }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transação não encontrada',
            });
        }

        const items = await Item.findAll({
            where: { transactionId }
        });

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
            closedAt: transaction.closedAt
                ? new Date(transaction.closedAt).toLocaleDateString('pt-BR')
                : null,

            // Adição dos items no retorno da API
            items: items.map(item => ({
                id: item.id,
                itemCode: item.itemCode,
                description: item.description,
                quantity: item.quantity,
                amount: item.amount,
            }))
        };

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