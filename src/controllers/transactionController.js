// controllers/transactionController.js
const Transactions = require('../models/transaction.model.js'); // Importando o modelo de transações

// Função para criar uma transação
exports.saveTransaction = async (data, credit) => {
    try {
        // Cria uma nova transação com os dados recebidos no corpo da requisição
        //const transaction = await Transactions.create(req.body);
        console.log('SAVE TRANSACTION')
        console.log(data.charges[0].payment_method)
        console.log(data)
        

        const objectTransaction = {
            status: data.status,
            transactionType: 1,
            transactionId: data.id,
            transactionCode: data.code,
            amount: data.amount,
            currency: data.currency,
            payment_method: data.charges[0].payment_method,
            closed: data.closed,
            customerId: data.customer.id,
            customerName: data.customer.name,
            customerEmail: data.customer.email,
            customerDocument: data.customer.document,
            balance: credit,
            //////////
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            closedAt: data.closed_at,
        }

        // Retorna sucesso com os dados da transação criada
        const transaction = await Transactions.create(objectTransaction);

        if (!transaction) {
            console.error('Falha ao criar transação:', transaction.message);
            
            return {
                success: false,
                message: 'Erro ao criar transação:',
            }

        } else {

            return {
                success: true,
                message: 'Transação salva com sucesso',
            };
        }


        

    } catch (error) {
        // Retorna um erro se algo der errado
        console.error("Erro ao criar transação:", error);
        return {
            success: false,
            message: error.message || 'Erro ao criar transação:',
        }
    }
};