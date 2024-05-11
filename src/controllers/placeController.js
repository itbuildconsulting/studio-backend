const { password } = require('../config/database.js');
const Place = require('../models/place.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
exports.create = async (req, res, next) => {
    try {
        const { name, email, password, active } = req.body;
        const newPlace = await Place.create({ name, email, password, active });
        res.status(201).json(newPlace);
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        res.status(500).send('Erro ao criar pessoa');
    }
};

// READ
exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Place.findAll().then((Places) => {
              res.status(200).json(Places);
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
        const Place = await Place.findByPk(id);
        if (!Place) {
            return res.status(404).send('Pessoa não encontrada');
        }
        res.status(200).json(Place);
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
        const Place = await Place.findByPk(id);
        if (!Place) {
            return res.status(404).send('Pessoa não encontrada');
        }
        Place.name = name;
        Place.email = email;
        await Place.save();
        res.status(200).json(Place);
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        res.status(500).send('Erro ao atualizar pessoa');
    }
};

// DELETE
exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Place = await Place.findByPk(id);
        if (!Place) {
            return res.status(404).send('Pessoa não encontrada');
        }
        await Place.destroy();
        res.status(200).send('Pessoa excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir pessoa:', error);
        res.status(500).send('Erro ao excluir pessoa');
    }
};