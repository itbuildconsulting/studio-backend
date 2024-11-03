import Item from '../models/Item.model'; // Certifique-se que o caminho está correto

// Interface para os dados do item
interface ItemData {
    itemId: number;  // Mudança para number
    code: string;
    description: string;
    quantity: number;
    amount: number;
    credit: number;
}

// Função para criar itens após uma transação
export const createItemsAfterTransaction = async (
    transactionId: string,
    itemsData: ItemData[]
): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
        // Processar cada item fornecido no array de itens
        for (const itemData of itemsData) {
            await createItem(transactionId, itemData);
        }

        return { success: true, message: "Todos os itens foram criados com sucesso." };
    } catch (error: any) {
        console.error("Erro ao criar itens após transação:", error);
        return { success: false, message: "Erro ao criar itens.", error: error.message };
    }
};

// Função auxiliar para criar um novo item
const createItem = async (transactionId: string, itemData: ItemData): Promise<void> => {
    try {
        await Item.create({
            itemId: itemData.itemId,
            transactionId: transactionId,
            itemCode: itemData.code,
            description: itemData.description,
            quantity: itemData.quantity,
            amount: itemData.amount,
            balance: itemData.credit, // Inicializa balance com o montante do crédito
            status: "concluído", // Defina o status inicial, ajuste conforme necessário
            created_at: new Date(),
            updated_at: new Date(),
        });
    } catch (error: any) {
        console.error("Erro ao criar item:", error);
        throw error; // Lançar erro para ser capturado pelo gerenciador
    }
};
