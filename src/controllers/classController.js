const { password } = require('../config/database.js');
const Class = require('../models/class.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
exports.create = async (req, res, next) => {
    try {
        const { name, email, password, active } = req.body;
        const newClass = await Class.create({ name, email, password, active });
        res.status(201).json(newClass);
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        res.status(500).send('Erro ao criar pessoa');
    }
};

// READ
exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Class.findAll().then((Classs) => {
              res.status(200).json(Classs);
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
        const Class = await Class.findByPk(id);
        if (!Class) {
            return res.status(404).send('Pessoa não encontrada');
        }
        res.status(200).json(Class);
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
        const Class = await Class.findByPk(id);
        if (!Class) {
            return res.status(404).send('Pessoa não encontrada');
        }
        Class.name = name;
        Class.email = email;
        await Class.save();
        res.status(200).json(Class);
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        res.status(500).send('Erro ao atualizar pessoa');
    }
};

// DELETE
exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Class = await Class.findByPk(id);
        if (!Class) {
            return res.status(404).send('Pessoa não encontrada');
        }
        await Class.destroy();
        res.status(200).send('Pessoa excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir pessoa:', error);
        res.status(500).send('Erro ao excluir pessoa');
    }
};