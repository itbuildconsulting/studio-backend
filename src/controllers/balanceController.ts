import Credit from '../models/Credit.model';
import { Op } from 'sequelize';

interface BalanceResponse {
    success: boolean;
    message: string; 
}

export const updateCustomerBalance = async (
    idCustomer: number,
    transactionAmount: number,
    transactionId: string,
    add: boolean,
    productItems: number
): Promise<BalanceResponse> => {
    try {
        // 1. Verificar se o usuário já possui créditos registrados
        const existingCredits = await Credit.findAll({
            where: {
                idCustomer,
                status: 'valid', // Somente créditos válidos
                expirationDate: { [Op.gte]: new Date() }, // Apenas créditos que não expiraram
            },
        });

        if (existingCredits.length > 0) {
            // 2. Se houver créditos válidos, ajustar o saldo dos créditos
            for (const credit of existingCredits) {
                if (add) {
                    credit.availableCredits += transactionAmount; // Adicionar créditos
                } else {
                    credit.availableCredits -= transactionAmount; // Subtrair créditos
                }

                credit.status = credit.availableCredits <= 0 ? 'used' : 'valid'; // Atualiza o status para 'used' caso os créditos acabem
                credit.lastUpdated = new Date();  // Atualiza a data de última modificação
                await credit.save();
            }

            return {
                success: true,
                message: 'Créditos atualizados com sucesso',
            };
        } else {
            productItems
            // 3. Se o cliente não tiver créditos válidos, criar um novo crédito
            const newCredit = await Credit.create({
                idCustomer,
                availableCredits: add ? transactionAmount : -transactionAmount,  // Definir valor positivo ou negativo
                usedCredits: 0, // Créditos ainda não utilizados
                status: 'valid',  // Status inicial é 'valid'
                productTypeId: productItems,
                expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Exemplo: validade de 1 ano
                creditBatch: transactionId, // Lote de créditos (pode ser gerado de acordo com a lógica de cada transação)
                origin: 'Compra',  // Exemplo: origem do crédito (pode ser adaptado conforme necessário)
            });

            return {
                success: true,
                message: 'Novo crédito criado com sucesso',
            };
        }
    } catch (error: any) {
        console.error('Erro ao atualizar créditos do usuário:', error);
        return {
            success: false,
            message: error.message || 'Erro ao atualizar créditos',
        };
    }
};
