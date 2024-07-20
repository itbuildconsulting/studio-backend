// services/pagarmeService.js
const pagarme = require('pagarme')

class PagarmeService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.client = null;
    }

    async connect() {
        if (!this.client) {
            this.client = await pagarme.client.connect({ api_key: this.apiKey });
        }
    }

    async createTransaction(transactionData) {
        await this.connect();
        return this.client.transactions.create(transactionData);
    }

    // Adicionar mais métodos conforme necessário
}

module.exports = new PagarmeService(process.env.PAGARME_API_KEY);
