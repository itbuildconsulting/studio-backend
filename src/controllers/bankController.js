const { password } = require('../config/database.js');
const Bank = require('../models/bank.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
exports.create = async (req, res, next) => {
    try {
        const { name, email, password, active } = req.body;
        const newBank = await Bank.create({ name, email, password, active });
        res.status(201).json(newBank);
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        res.status(500).send('Erro ao criar pessoa');
    }
};

// READ
exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Bank.findAll().then((Banks) => {
              res.status(200).json(Banks);
            });
          });
    } catch (error) {
        console.error('Erro ao buscar pessoas:', error);
        res.status(500).send('Erro ao buscar pessoas');
    }
};

exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Bank = await Bank.findByPk(id);
        if (!Bank) {
            return res.status(404).send('Pessoa não encontrada');
        }
        res.status(200).json(Bank);
    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        res.status(500).send('Erro ao buscar pessoa');
    }
};

// UPDATE
exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const Bank = await Bank.findByPk(id);
        if (!Bank) {
            return res.status(404).send('Pessoa não encontrada');
        }
        Bank.name = name;
        Bank.email = email;
        await Bank.save();
        res.status(200).json(Bank);
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        res.status(500).send('Erro ao atualizar pessoa');
    }
};

// DELETE
exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Bank = await Bank.findByPk(id);
        if (!Bank) {
            return res.status(404).send('Pessoa não encontrada');
        }
        await Bank.destroy();
        res.status(200).send('Pessoa excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir pessoa:', error);
        res.status(500).send('Erro ao excluir pessoa');
    }
};