const { password } = require('../config/database.js');
const Product = require('../models/product.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
exports.create = async (req, res, next) => {
    try {
        const { name, email, password, active } = req.body;
        const newProduct = await Product.create({ name, email, password, active });
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        res.status(500).send('Erro ao criar pessoa');
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
        console.error('Erro ao buscar pessoas:', error);
        res.status(500).send('Erro ao buscar pessoas');
    }
};

exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Product = await Product.findByPk(id);
        if (!Product) {
            return res.status(404).send('Pessoa não encontrada');
        }
        res.status(200).json(Product);
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
        const Product = await Product.findByPk(id);
        if (!Product) {
            return res.status(404).send('Pessoa não encontrada');
        }
        Product.name = name;
        Product.email = email;
        await Product.save();
        res.status(200).json(Product);
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        res.status(500).send('Erro ao atualizar pessoa');
    }
};

// DELETE
exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const Product = await Product.findByPk(id);
        if (!Product) {
            return res.status(404).send('Pessoa não encontrada');
        }
        await Product.destroy();
        res.status(200).send('Pessoa excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir pessoa:', error);
        res.status(500).send('Erro ao excluir pessoa');
    }
};