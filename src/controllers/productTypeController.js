const { password } = require('../config/database.js');
const ProductType = require('../models/productType.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
exports.create = async (req, res, next) => {
    try {
        const { name, active } = req.body;
        const newProductType = await ProductType.create({ name, active });
        res.status(201).json(newProductType);
    } catch (error) {
        console.error('Erro ao criar tipo:', error);
        res.status(500).send('Erro ao criar tipo');
    }
};

// READ
exports.getAll = async (req, res, next) => {
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

exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const ProductType = await ProductType.findByPk(id);
        if (!ProductType) {
            return res.status(404).send('tipo não encontrada');
        }
        res.status(200).json(ProductType);
    } catch (error) {
        console.error('Erro ao buscar tipo:', error);
        res.status(500).send('Erro ao buscar tipo');
    }
};

// UPDATE
exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const ProductType = await ProductType.findByPk(id);
        if (!ProductType) {
            return res.status(404).send('tipo não encontrada');
        }
        ProductType.name = name;
        ProductType.email = email;
        await ProductType.save();
        res.status(200).json(ProductType);
    } catch (error) {
        console.error('Erro ao atualizar tipo:', error);
        res.status(500).send('Erro ao atualizar tipo');
    }
};

// DELETE
exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const ProductType = await ProductType.findByPk(id);
        if (!ProductType) {
            return res.status(404).send('tipo não encontrada');
        }
        await ProductType.destroy();
        res.status(200).send('tipo excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir tipo:', error);
        res.status(500).send('Erro ao excluir tipo');
    }
};