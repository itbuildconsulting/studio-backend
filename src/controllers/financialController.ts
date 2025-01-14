import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Transactions from '../models/Transaction.model'; // Importando o modelo de transações


export const getFilteredTransactions = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { customerName, status, createdAt, transactionId } = req.body;

        // Montar os critérios de busca dinamicamente
        const filters: any = {};

        if (customerName) {
            filters.customerName = { [Op.like]: `%${customerName}%` }; // Busca parcial por nome
        }

        if (status) {
            filters.status = status; // Busca exata por status
        }

        if (createdAt) {
            filters.createdAt = { [Op.eq]: new Date(createdAt) }; // Busca exata por data
        }

        if (transactionId) {
            filters.transactionId = transactionId; // Busca exata por ID da transação
        }

        // Busca no banco com os filtros
        const transactions = await Transactions.findAll({
            where: filters,
            attributes: ['transactionId', 'amount', 'customerName', 'status', 'createdAt'], // Seleciona apenas os campos necessários
            order: [['createdAt', 'DESC']], // Ordena pelas transações mais recentes
        });

        // Formata os dados
        const formattedTransactions = transactions.map(transaction => ({
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            customerName: transaction.customerName,
            status: transaction.status,
            createdAt: new Date(transaction.createdAt).toLocaleDateString('pt-BR'), // Formata a data
        }));

        // Retorna o resultado
        return res.status(200).json({
            success: true,
            data: formattedTransactions,
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