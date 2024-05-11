const { password } = require('../config/database.js');
const Place = require('../models/place.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
exports.create = async (req, res, next) => {
    try {
        const { name, active } = req.body;
        const newPlace = await Place.create({ name, active });
        res.status(201).json(newPlace);
    } catch (error) {
        console.error('Erro ao criar local:', error);
        res.status(500).send('Erro ao criar local');
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
        console.error('Erro ao buscar local:', error);
        res.status(500).send('Erro ao buscar local');
    }
};

exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Place = await Place.findByPk(id);
        if (!Place) {
            return res.status(404).send('local não encontrado');
        }
        res.status(200).json(Place);
    } catch (error) {
        console.error('Erro ao buscar local:', error);
        res.status(500).send('Erro ao buscar local');
    }
};

// UPDATE
exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const Place = await Place.findByPk(id);
        if (!Place) {
            return res.status(404).send('local não encontrado');
        }
        Place.name = name;
        Place.email = email;
        await Place.save();
        res.status(200).json(Place);
    } catch (error) {
        console.error('Erro ao atualizar local:', error);
        res.status(500).send('Erro ao atualizar local');
    }
};

// DELETE
exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Place = await Place.findByPk(id);
        if (!Place) {
            return res.status(404).send('local não encontrada');
        }
        await Place.destroy();
        res.status(200).send('local excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir local:', error);
        res.status(500).send('Erro ao excluir local');
    }
};