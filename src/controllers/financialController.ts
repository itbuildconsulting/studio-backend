import { Request, Response } from 'express';
import Transactions from '../models/Transaction.model'; // Importando o modelo de transações


export const getLatestTransactions = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const transactions = await Transactions.findAll({
            attributes: ['transactionId', 'amount', 'customerName', 'status', 'createdAt'], // Only select necessary fields
            order: [['createdAt', 'DESC']], // Order by latest transactions
            limit: 10, // Limit to the latest 10 transactions
        });

        // Map through the transactions and format the dates correctly
        const formattedTransactions = transactions.map(transaction => {
            return {
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                customerName: transaction.customerName,
                status: transaction.status,
                createdAt: new Date(transaction.createdAt).toLocaleDateString('pt-BR'), // Format date in DD/MM/YYYY
            };
        });

        return res.status(200).json({
            success: true,
            transactions: formattedTransactions,
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