module.exports = {
    convertToCents: function (reais) {
        return Math.round(reais * 100);
    },

    validateCPF: function (cpf) {
        // Implementar validação de CPF
        return true; // Simplesmente um placeholder
    },

    formatClientData: function (client) {
        return {
            external_id: client.id,
            name: client.name,
            type: 'individual',
            country: 'br',
            email: client.email,
            documents: [
                {
                    type: 'cpf',
                    number: client.cpf,
                },
            ],
            phone_numbers: [client.phone],
            birthday: client.birthday
        };
    },

    handleError: function (error) {
        // Extrair e logar detalhes do erro
        console.error('Erro na API do Pagar.me:', error);
        return error.response ? error.response.data : error.message;
    }
};
