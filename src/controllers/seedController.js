const personCommand = require('../core/business/personCommand.js'); // Importe o módulo que contém a função createDataBase()
const person = require('../models/person.model.js')
// Define as funções do controlador
const seedController = {
    async post(req, res, next) {
        try {
            await personCommand.createDataBase(); // Chame createDataBase() antes de lidar com a requisição POST
            res.status(201).send('Requisição recebida com sucesso!');
        } catch (error) {
            console.error('Erro:', error);
            res.status(500).send('Erro ao processar a requisição.');
        }
    },
    async put(req, res, next) {
        try {
            let id = req.params.id;
            await personCommand.createDataBase(); // Chame createDataBase() antes de lidar com a requisição PUT
            res.status(201).send(`Requisição recebida com sucesso! ${id}`);
        } catch (error) {
            console.error('Erro:', error);
            res.status(500).send('Erro ao processar a requisição.');
        }
    },
    async delete(req, res, next) {
        try {
            let id = req.params.id;
            await personCommand.createDataBase(); // Chame createDataBase() antes de lidar com a requisição PUT
            res.status(201).send(`Requisição recebida com sucesso! ${id}`);
        } catch (error) {
            console.error('Erro:', error);
            res.status(500).send('Erro ao processar a requisição.');
        }
    },
    async get(req, res, next) {
        try {
            const users = await person.findAll();
            res.status(201).send(`Requisição recebida com sucesso!`);
        } catch (error) {
            console.error('Erro:', error);
            res.status(500).send(`Erro ao processar a requisição. ${error}`);
        }
    },
};

module.exports = seedController;
           
