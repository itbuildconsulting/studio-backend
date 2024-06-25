const { password } = require('../core/db/database.js');
const ProductType = require('../models/productType.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
module.exports.create = async (req, res, next) => {
    try {
        const { name, active, placeId } = req.body;
        const newProductType = await ProductType.create({ name, active, placeId });
        res.status(201).json(newProductType);
    } catch (error) {
        console.error('Erro ao criar tipo:', error);
        res.status(500).send('Erro ao criar tipo');
    }
};

// READ
module.exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            ProductType.findAll().then((ProductTypes) => {
              res.status(200).json(ProductTypes);
            });
          });
    } catch (error) {
        console.error('Erro ao buscar tipos:', error);
        res.status(500).send('Erro ao buscar tipos');
    }
};

module.exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const getProductType = await ProductType.findByPk(id);
        if (!getProductType) {
            return res.status(404).send('tipo não encontrada');
        }
        res.status(200).json(getProductType);
    } catch (error) {
        console.error('Erro ao buscar tipo:', error);
        res.status(500).send('Erro ao buscar tipo');
    }
};

// UPDATE
module.exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const getProductType = await ProductType.findByPk(id);
        if (!getProductType) {
            return res.status(404).send('tipo não encontrada');
        }
        getProductType.name = name;
        getProductType.email = email;
        await getProductType.save();
        res.status(200).json(getProductType);
    } catch (error) {
        console.error('Erro ao atualizar tipo:', error);
        res.status(500).send('Erro ao atualizar tipo');
    }
};

// DELETE
module.exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const getProductType = await ProductType.findByPk(id);
        if (!getProductType) {
            return res.status(404).send('tipo não encontrada');
        }
        await getProductType.destroy();
        res.status(200).send('tipo excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir tipo:', error);
        res.status(500).send('Erro ao excluir tipo');
    }
};