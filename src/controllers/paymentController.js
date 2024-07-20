const pagarmeService = require('../core/payment/pagarmeService');
const pagarme = require('pagarme')


// READ
module.exports.createTransaction = async (req, res, next) => {
    try {
        const client = await pagarme.client.connect({
            api_key: process.env.PAGARME_API_KEY
        });
        const transaction = await client.transactions.create(req.body);
        

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Erro na API Pagar.me:', error);
        if (error.response) {
            console.error('Detalhes do erro:', error.response);
            res.status(500).json({ message: 'Erro na transação', details: error.response });
        } else {
            res.status(500).send('Erro interno no servidor');
        }
    }
};