const executeQueryWithoutTransaction = require('../db/database');
const { sqlQueries } = require('../sqls/sqls.js');

const personCommand = {
    async showAllPerson() {
        try {
            return await executeQueryWithoutTransaction(sqlQueries['showAllPerson'], true);
        } catch (error) {
            console.error('Erro ao exibir todas as pessoas:', error);
            throw error;
        }
    },
    
    async createDataBase() {
        try {
            await executeQueryWithoutTransaction(sqlQueries['ct_Person'], false);
        } catch (error) {
            console.error('Erro ao criar base de dados:', error);
            throw error;
        }
    }
};

module.exports = personCommand;
