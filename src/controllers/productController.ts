import { Request, Response} from 'express';
import Product from '../models/Product.model';
import ProductType from '../models/ProductType.model';
import Place from '../models/Place.model';

// CREATE
export const createProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name, credit, validateDate, productTypeId, value, active } = req.body;

        // Validação dos campos obrigatórios
        const validationError = validateProductData(req.body);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        // Criação do novo produto
        const newProduct = await Product.create({ name, credit, validateDate, productTypeId, value, active });
        return res.status(201).json({ success: true, message: 'Produto criado com sucesso', id: newProduct.id });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        return res.status(500).json({ success: false, error: 'Erro ao criar produto' });
    }
};

// READ ALL
export const getAllProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { page = 1, pageSize = 10 } = req.query;

        // Configurar paginação
        const limit = parseInt(pageSize as string, 10); // Número de registros por página
        const offset = (parseInt(page as string, 10) - 1) * limit; // Deslocamento

        // Busca com paginação e relacionamentos
        const { rows: products, count: totalRecords } = await Product.findAndCountAll({
            include: [
                {
                    model: ProductType,
                    as: 'productType',
                    attributes: ['name'], // Inclui apenas o nome do ProductType
                    include: [
                        {
                            model: Place,
                            as: 'place', // Usa o alias correto para Place, se definido
                            attributes: ['name'], // Inclui apenas o nome do Place
                        },
                    ],
                },
            ],
            limit,
            offset,
        });

        // Retornar resultado com paginação
        return res.status(200).json({
            success: true,
            data: products,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: parseInt(page as string, 10),
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar produtos',
        });
    }
};

// READ BY ID
export const getProductById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [
                {
                    model: ProductType,
                    as: 'productType',
                    attributes: ['name']
                }
            ]
        });

        if (!product) {
            return res.status(404).send('Produto não encontrado');
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        return res.status(500).send('Erro ao buscar produto');
    }
};

// READ Dropdown
export const getDropdownProducts = async (req: Request, res: Response): Promise<Response> => {
    const { productTypeId } = req.params; // Obtenção do productTypeId da rota

    const queryOptions: any = {
        attributes: ['id', 'name'], // Retorna apenas 'id' e 'name' do produto
    };

    // Adiciona a condição de filtro se productTypeId for fornecido e válido
    if (productTypeId && productTypeId !== 'null') {
        queryOptions.where = { productTypeId };
    }

    try {
        const products = await Product.findAll(queryOptions);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Nenhum produto encontrado' });
        }

        return res.status(200).json(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({ message: 'Erro ao buscar produtos', error: error });
    }
};

// UPDATE
export const updateProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { name, credit, validateDate, productTypeId, value, active } = req.body;

        // Validação dos campos obrigatórios
        const validationError = validateProductData(req.body);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        // Verifica se o produto existe
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Produto não encontrado' });
        }

        // Atualização do produto
        product.name = name;
        product.credit = credit;
        product.validateDate = validateDate;
        product.productTypeId = productTypeId;
        product.value = value;
        product.active = active;

        await product.save();

        return res.status(200).json({ success: true, message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        return res.status(500).json({ success: false, error: 'Erro ao atualizar produto' });
    }
};


// DELETE
export const deleteProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        // Verifica se o produto existe
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Produto não encontrado' });
        }

        // Desativa o produto (altera o campo active para false)
        product.active = 0;
        await product.save();

        return res.status(200).json({ success: true, message: 'Produto desativado com sucesso' });
    } catch (error) {
        console.error('Erro ao desativar produto:', error);
        return res.status(500).json({ success: false, error: 'Erro ao desativar produto' });
    }
};

// Função de validação dos campos obrigatórios
const validateProductData = (productData: any) => {
    const { name, credit, validateDate, productTypeId, value, active } = productData;

    if (!name || name.trim() === '') return 'O campo name é obrigatório';
    if (!credit) return 'O campo credit é obrigatório';
    if (!validateDate) return 'O campo validateDate é obrigatório';
    if (!productTypeId) return 'O campo productTypeId é obrigatório';
    if (!value) return 'O campo value é obrigatório';
    if (active === undefined) return 'O campo active é obrigatório';

    return null;  // Retorna null se todos os campos estiverem válidos
};
