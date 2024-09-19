const Items = require('../models/items.model'); // Certifique-se que o caminho está correto

// Função para criar itens após uma transação
exports.createItemsAfterTransaction = async (transactionId, itemsData) => {
    try {
        // Processar cada item fornecido no array de itens
        for (const itemData of itemsData) {
            await createItem(transactionId, itemData);
        }
        
        return { success: true, message: "Todos os itens foram criados com sucesso." };
    } catch (error) {
        console.error("Erro ao criar itens após transação:", error);
        return { success: false, message: "Erro ao criar itens.", error: error.message };
    }
};

// Função auxiliar para criar um novo item
async function createItem(transactionId, itemData) {
    try {
        await Items.create({
            itemId: itemData.itemId,
            transactionId: transactionId,
            itemCode: itemData.code,
            description: itemData.description,
            quantity: itemData.quantity,
            amount: itemData.amount,
            balance: itemData.credit, // Suponha que balance seja inicializado com o montante
            status: "concluído", // Defina o status inicial, ajuste conforme necessário
            created_at: new Date(),
            updated_at: new Date()
        });
    } catch (error) {
        console.error("Erro ao criar item:", error);
        throw error; // Lançar erro para ser capturado pelo gerenciador
    }
}
