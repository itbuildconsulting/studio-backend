const { password } = require('../core/db/database.js');
const Bank = require('../models/bank.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
module.exports.create = async (req, res, next) => {
    try {
        const { value, config, active } = req.body;
        const newBank = await Bank.create({ value, config, active });
        res.status(201).json(newBank);
    } catch (error) {
        console.error('Erro ao criar bank:', error);
        res.status(500).send('Erro ao criar bank');
    }
};

// READ
module.exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Bank.findAll().then((Banks) => {
              res.status(200).json(Banks);
            });
          });
    } catch (error) {
        console.error('Erro ao buscar banks:', error);
        res.status(500).send('Erro ao buscar banks');
    }
};

module.exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Bank = await Bank.findByPk(id);
        if (!Bank) {
            return res.status(404).send('bank não encontrada');
        }
        res.status(200).json(Bank);
    } catch (error) {
        console.error('Erro ao buscar bank:', error);
        res.status(500).send('Erro ao buscar bank');
    }
};

// UPDATE
module.exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const Bank = await Bank.findByPk(id);
        if (!Bank) {
            return res.status(404).send('bank não encontrada');
        }
        Bank.name = name;
        Bank.email = email;
        await Bank.save();
        res.status(200).json(Bank);
    } catch (error) {
        console.error('Erro ao atualizar bank:', error);
        res.status(500).send('Erro ao atualizar bank');
    }
};

// DELETE
module.exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Bank = await Bank.findByPk(id);
        if (!Bank) {
            return res.status(404).send('bank não encontrada');
        }
        await Bank.destroy();
        res.status(200).send('bank excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir bank:', error);
        res.status(500).send('Erro ao excluir bank');
    }
};