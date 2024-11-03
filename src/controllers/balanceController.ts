import Balance from '../models/Balance.model'; // Importando o modelo de saldo

interface BalanceResponse {
    success: boolean;
    message: string;
}

export const updateCustomerBalance = async (
    idCustomer: number,
    transactionAmount: number,
    add: boolean
): Promise<BalanceResponse> => {
    try {
        const existingBalance = await Balance.findByPk(idCustomer);
        
        if (existingBalance) {
            // Ajusta o saldo baseado no tipo de operação (adição ou subtração)
            if (add) {
                existingBalance.balance += transactionAmount;
            } else {
                existingBalance.balance -= transactionAmount;
            }

            existingBalance.lastUpdated = new Date();  // Atualiza a data de última modificação
            await existingBalance.save();

            if (!existingBalance) {
                console.error('Falha ao salvar saldo:', existingBalance);
                return {
                    success: false,
                    message: 'Falha ao salvar saldo:',
                };
            } else {
                return {
                    success: true,
                    message: 'Saldo atualizado com sucesso',
                };
            }
        } else {
            // Se o saldo não existir, cria um novo registro com o saldo inicial
            const initialBalance = add ? transactionAmount : -transactionAmount;
            const newBalance = await Balance.create({
                idCustomer,
                balance: initialBalance,
                lastUpdated: new Date()
            });

            if (!newBalance) {
                console.error('Falha ao salvar saldo inicial:', newBalance);
                return {
                    success: false,
                    message: 'Falha ao salvar saldo inicial:',
                };
            } else {
                return {
                    success: true,
                    message: 'Saldo inicial criado com sucesso',
                };
            }
        }
    } catch (error: any) {
        console.error('Erro ao atualizar saldo:', error);
        return {
            success: false,
            message: error.message || 'Erro ao atualizar saldo',
        };
    }
};
