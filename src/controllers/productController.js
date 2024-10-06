const { password } = require('../core/db/database.js');
const Product = require('../models/product.model.js');
const ProductType = require('../models/productType.model.js');
const Place = require('../models/place.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
module.exports.create = async (req, res, next) => {
    try {
        const { name, credit, validateDate, productTypeId, placeId, value, active, } = req.body;
        const newProduct = await Product.create({ name, credit, validateDate, productTypeId, placeId, value, active });
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).send('Erro ao criar produto');
    }
};

// READ
module.exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Product.findAll({
                include: [
                    {
                        model: Place,
                        attributes: ['name']  // Adapte conforme necessário para incluir outros campos
                    },
                    {
                        model: ProductType,
                        attributes: ['name']  // Substitua 'typeName' pelo campo correto do seu modelo ProductType
                    }
                ]
            }).then((Products) => {
              res.status(200).json(Products);
            });
          });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).send('Erro ao buscar produtos');
    }
};

module.exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const getProduct = await Product.findByPk(id);
        if (!getProduct) {
            return res.status(404).send('produto não encontrada');
        }
        res.status(200).json(getProduct);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).send('Erro ao buscar produto');
    }
};

module.exports.getDropdown = async (req, res, next) => {
    const productTypeId = req.params.productTypeId; // Obtenção do productTypeId da rota

    // Construindo o objeto de consulta
    const queryOptions = {
        attributes: ['id', 'name'], // Especifica que apenas 'id' e 'name' do produto são necessários
    };

    // Adiciona a condição de filtro somente se productTypeId for fornecido e não for 'null'
    if (productTypeId && productTypeId !== 'null') {
        queryOptions.where = {
            productTypeId: productTypeId
        };
    }

    try {
        const products = await Product.findAll(queryOptions);

        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found' });
        }

        return res.status(200).json(products);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};


// UPDATE
module.exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        const getProduct = await Product.findByPk(id);
        if (!getProduct) {
            return res.status(404).send('produto não encontrada');
        }
        getProduct.name = name;
        getProduct.email = email;
        await getProduct.save();
        res.status(200).json(getProduct);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).send('Erro ao atualizar produto');
    }
};

// DELETE
module.exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const getProduct = await Product.findByPk(id);
        if (!getProduct) {
            return res.status(404).send('produto não encontrada');
        }
        await getProduct.destroy();
        res.status(200).send('produto excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).send('Erro ao excluir produto');
    }
};