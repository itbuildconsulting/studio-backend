// Importando os módulos necessários
const mysql = require('mysql2/promise');

// Configurações do servidor e banco de dados
const dbConfig = {
    host: 'localhost', // Seu host MySQL
    user: 'studio_USER', // Seu usuário MySQL
    password: 'studio_PASSWORD', // Sua senha MySQL
    database: 'studio_DB' // Sua base de dados MySQL
};

async function executeQueryWithoutTransaction(cmd_query, withReturn) {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Extrair os dados do corpo da requisição
        const [results] = await connection.query(cmd_query);

        // Fechar a conexão com o banco de dados
        await connection.end();

        if (withReturn) {
            return results;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Erro ao executar consulta SQL:', error);
        throw error; // Propagar o erro para quem chamou a função
    }
}

module.exports = executeQueryWithoutTransaction;