// Importando os módulos necessários
const express = require('express');
const mysql = require('mysql2/promise');

// Configurações do servidor e banco de dados
const app = express();
const PORT = process.env.PORT || 3000;

const dbConfig = {
    host: 'localhost', // Seu host MySQL
    user: 'studio_USER', // Seu usuário MySQL
    password: 'studio_PASSWORD', // Sua senha MySQL
    database: 'studio_DB' // Sua base de dados MySQL
};

// Rota para cadastrar um aluno
app.post('/alunos', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Extrair os dados do corpo da requisição
        const { nome, idade, curso } = req.body;

        // Query para inserir um novo aluno
        const [results] = await connection.query('INSERT INTO alunos (nome, idade, curso) VALUES (?, ?, ?)', [nome, idade, curso]);

        // Fechar a conexão com o banco de dados
        await connection.end();

        res.status(201).json({ message: 'Aluno cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar aluno:', error);
        res.status(500).json({ error: 'Erro ao cadastrar aluno' });
    }
});

// Rota para cadastrar um aluno
app.get('/create', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Query para inserir um novo aluno
        const [results] = await connection.query('CREATE TABLE aluno (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255) NOT NULL, idade INT, curso VARCHAR(100));');

        // Fechar a conexão com o banco de dados
        await connection.end();

        res.status(201).json({ message: 'Tabela Aluno criada com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar tabela aluno:', error);
        res.status(500).json({ error: 'Erro ao criar tabela aluno' });
    }
});

app.get('/drop', async (req, res) => {
    try {
        // Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        // Query para inserir um novo aluno
        const [results] = await connection.query('drop TABLE aluno');

        // Fechar a conexão com o banco de dados
        await connection.end();

        res.status(201).json({ message: 'Tabela Aluno destruida com sucesso!' });
    } catch (error) {
        console.error('Erro ao destruir tabela aluno:', error);
        res.status(500).json({ error: 'Erro ao destruir tabela aluno' });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
