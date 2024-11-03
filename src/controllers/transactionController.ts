import Transactions from '../models/Transaction.model'; // Importando o modelo de transações


// Interface para os dados que são recebidos pela API externa
interface TransactionData {
    status: string;
    id: string;
    code: string;
    amount: number;
    currency: string;
    charges: {
        payment_method: string;
    }[];
    closed: boolean;
    customer: {
        id: string;
        name: string;
        email: string;
        document: string;
    };
    created_at: string;
    updated_at: string;
    closed_at: string;
}

// Função para salvar transação
export const saveTransaction = async (data: TransactionData, credit: number): Promise<{ success: boolean; message: string }> => {
    try {
        console.log('SAVE TRANSACTION');
        console.log(data.charges[0].payment_method);
        console.log(data);

        // Criar o objeto de transação
        const objectTransaction = {
            status: data.status,
            transactionType: 1,  // Assumindo que seja crédito
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
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            closedAt: new Date(data.closed_at),
        };

        // Salvar a transação no banco de dados
        const transaction = await Transactions.create(objectTransaction);

        if (!transaction) {
            console.error('Falha ao criar transação:', transaction);
            return {
                success: false,
                message: 'Erro ao criar transação',
            };
        } else {
            return {
                success: true,
                message: 'Transação salva com sucesso',
            };
        }

    } catch (error: any) {
        // Retorna um erro se algo der errado
        console.error("Erro ao criar transação:", error);
        return {
            success: false,
            message: error.message || 'Erro ao criar transação',
        };
    }
};

