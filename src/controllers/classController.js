const { password } = require('../config/database.js');
const Class = require('../models/class.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
exports.create = async (req, res, next) => {
    try {
        const { name, limit, income, date, config, kickback, kickbackRule, active } = req.body;
        const newClass = await Class.create({ name, limit, income, date, config, kickback, kickbackRule, active });
        res.status(201).json(newClass);
    } catch (error) {
        console.error('Erro ao criar aula:', error);
        res.status(500).send('Erro ao criar aula');
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
        console.error('Erro ao buscar aulas:', error);
        res.status(500).send('Erro ao buscar aulas');
    }
};

exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Class = await Class.findByPk(id);
        if (!Class) {
            return res.status(404).send('aula não encontrada');
        }
        res.status(200).json(Class);
    } catch (error) {
        console.error('Erro ao buscar aula:', error);
        res.status(500).send('Erro ao buscar aula');
    }
};

// UPDATE
exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const Class = await Class.findByPk(id);
        if (!Class) {
            return res.status(404).send('aula não encontrada');
        }
        Class.name = name;
        Class.email = email;
        await Class.save();
        res.status(200).json(Class);
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        res.status(500).send('Erro ao atualizar aula');
    }
};

// DELETE
exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Class = await Class.findByPk(id);
        if (!Class) {
            return res.status(404).send('aula não encontrada');
        }
        await Class.destroy();
        res.status(200).send('aula excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        res.status(500).send('Erro ao excluir aula');
    }
};