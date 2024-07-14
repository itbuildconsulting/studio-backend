const { password } = require('../core/db/database.js');
const ProductType = require('../models/productType.model.js');
const Place = require('../models/place.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
module.exports.create = async (req, res, next) => {
    try {
        const { name, active, placeId } = req.body;
        const newProductType = await ProductType.create({ name, active, placeId });
        res.status(201).json(newProductType);
    } catch (error) {
        console.error('Erro ao criar Tipos de Produtos:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao criar Tipo de Produto'
            }
        );
    }
};

// READ
module.exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            ProductType.findAll({
                include: [{
                    model: Place,  // Substitua 'Place' pelo nome correto do seu modelo, se necessário
                    attributes: ['name']  // Apenas inclui o campo 'name' do 'Place'
                }]
            }).then((ProductTypes) => {
              res.status(200).json(ProductTypes);
            });
          });
    } catch (error) {
        console.error('Erro ao buscar Tipos de Produtos:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao buscar Tipos de Produtos'
            }
        );
    }
};


// READ Dropdown
module.exports.getDropdown = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            ProductType.findAll({
                attributes: ['id', 'name'], // Especifica que apenas 'id' e 'name' do produto são necessários
                include: [
                    {
                        model: Place,
                        attributes: ['name'],  // Especifica que apenas o 'name' do Place é necessário
                        as: 'place'  // Use o alias correto se você tiver definido um no seu modelo de associação
                    }
                ]
            }).then((Products) => {
                res.status(200).json(Products);
            });
        });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao buscar Tipos de Produtos'
            }
        );
    }
};


module.exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const getProductType = await ProductType.findByPk(id);
        if (!getProductType) {
            return res.status(404).json(
                { 
                    success: false, 
                    error: 'Tipo de Produto não encontrado'
                }
            );
        }
        res.status(200).json(getProductType);
    } catch (error) {
        console.error('Erro ao buscar Tipo de Produto:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao buscar Tipo de Produto'
            }
        );
    }
};

// UPDATE
module.exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const getProductType = await ProductType.findByPk(id);
        if (!getProductType) {
            return res.status(404).json(
                { 
                    success: false, 
                    error: 'Tipo de Produto não encontrado'
                }
            );
        }
        getProductType.name = name;
        getProductType.email = email;
        await getProductType.save();
        res.status(200).json(getProductType);
    } catch (error) {
        console.error('Erro ao atualizar Tipo de Produto:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao atualizar Tipo de Produto'
            }
        );
    }
};

// DELETE
module.exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const getProductType = await ProductType.findByPk(id);
        if (!getProductType) {
            return res.status(404).json(
                { 
                    success: false, 
                    error: 'Tipo de Produto não encontrado'
                }
            );
        }
        await getProductType.destroy();
        res.status(200).json(
            { 
                success: true, 
                error: 'Tipo de Produto excluído com sucesso'
            }
        );
    } catch (error) {
        console.error('Erro ao excluir Tipo de Produto:', error);
        res.status(500).json(
            { 
                success: false, 
                error: 'Erro ao excluir Tipo de Produto'
            }
        );
    }
};