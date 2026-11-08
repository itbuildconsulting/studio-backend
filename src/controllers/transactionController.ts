import Transactions from '../models/Transaction.model'; // Importando o modelo de transações


// Interface para os dados que são recebidos pela API externa
interface TransactionData {
    status: string;
    id: string;
    code: string;
    amount: number;
    currency: string;
    charges: {
        id: any;
        payment_method: string;
    }[];
    closed: boolean;
    customer: {
        id: string;
        name: string;
        email: string;
        document: string;
    };
    createdAt: string;
    updatedAt: string;
    closed_at: string;
}

// Função para salvar transação
export const saveTransaction = async (data: TransactionData, credit: number, studentId: number, couponCode?: string, discountAmount?: number): Promise<{ success: boolean; message: string }> => {
    try {
        const objectTransaction = {
            status: data.status,
            transactionType: 1,
            transactionId: data.id,
            transactionCode: data.code,
            chargeId: data.charges[0].id,
            amount: data.amount,
            currency: data.currency,
            payment_method: data.charges[0].payment_method,
            closed: data.closed,
            customerId: data.customer.id,
            studentId: studentId,
            customerName: data.customer.name,
            customerEmail: data.customer.email,
            customerDocument: data.customer.document,
            balance: credit,
            closedAt: new Date(data.closed_at),
            couponCode: couponCode ?? null,
            discountAmount: discountAmount ? Math.round(discountAmount * 100) : null,
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

