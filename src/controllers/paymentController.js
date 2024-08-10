
const fetch = require('node-fetch');

// READ
module.exports.createTransaction = async (req, res, next) => {
    try {
        const response = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from("sk_test_ff6bdd05222244b48cf7a8544a86584c:").toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro na transação');
        }

        console.log(data);
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro na API Pagar.me:', error);

        if (error.response) {
            res.status(500).json({ message: 'Erro na transação', details: error.response });
        } else {
            res.status(500).json({ message: error.message || 'Erro interno no servidor' });
        }
    }
};