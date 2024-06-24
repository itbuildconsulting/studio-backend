const { password } = require('../core/db/database.js');
const Place = require('../models/place.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
module.exports.create = async (req, res, next) => {
    try {
        const { name, active, address } = req.body;
        const newPlace = await Place.create({ name, active, address });
        res.status(201).json(newPlace);
    } catch (error) {
        console.error('Erro ao criar local:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao criar local' }
            );
    }
};

// READ
module.exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Place.findAll().then((Places) => {
              res.status(200).json(Places);
            });
          });
    } catch (error) {
        console.error('Erro ao buscar local:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao buscar local' }
            );
    }
};

module.exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const getPlaces = await Place.findByPk(id);
        if (!getPlaces) {
            return res.status(404).send('local não encontrado');
        }
        res.status(200).json(getPlaces);
    } catch (error) {
        console.error('Erro ao buscar local:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao buscar local' }
            );
    }
};

// UPDATE
module.exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const getPlace = await Place.findByPk(id);
        if (!getPlace) {
            return res.status(404).send('local não encontrado');
        }
        getPlace.name = name;
        getPlace.email = email;
        await Place.save();
        res.status(200).json(Place);
    } catch (error) {
        console.error('Erro ao atualizar local:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao atualizar local' }
            );
            
    }
};

// DELETE
module.exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const getPlace = await Place.findByPk(id);
        if (!getPlace) {
            return res.status(404).send('local não encontrada');
        }
        await getPlace.destroy();
        res.status(200).send('local excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir local:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao excluir local' }
            );
    }
};