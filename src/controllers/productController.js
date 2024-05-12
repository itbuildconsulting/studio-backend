const { password } = require('../config/database.js');
const Product = require('../models/product.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
exports.create = async (req, res, next) => {
    try {
        const { name, cost, credit, active, productTypeId, placeId } = req.body;
        const { costPerClass } = cost / credit;
        const newProduct = await Product.create({ name, cost, credit, costPerClass, active, productTypeId, placeId });
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).send('Erro ao criar produto');
    }
};

// READ
exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Product.findAll().then((Products) => {
              res.status(200).json(Products);
            });
          });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).send('Erro ao buscar produtos');
    }
};

exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Product = await Product.findByPk(id);
        if (!Product) {
            return res.status(404).send('produto não encontrada');
        }
        res.status(200).json(Product);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).send('Erro ao buscar produto');
    }
};

// UPDATE
exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const Product = await Product.findByPk(id);
        if (!Product) {
            return res.status(404).send('produto não encontrada');
        }
        Product.name = name;
        Product.email = email;
        await Product.save();
        res.status(200).json(Product);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).send('Erro ao atualizar produto');
    }
};

// DELETE
exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Product = await Product.findByPk(id);
        if (!Product) {
            return res.status(404).send('produto não encontrada');
        }
        await Product.destroy();
        res.status(200).send('produto excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).send('Erro ao excluir produto');
    }
};