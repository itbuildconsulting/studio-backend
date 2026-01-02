import { Request, Response} from 'express';
import Product from '../models/Product.model';
import ProductType from '../models/ProductType.model';
import Place from '../models/Place.model';

// CREATE
export const createProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { 
            name, 
            credit, 
            validateDate, 
            productTypeId, 
            value, 
            active,
            usageRestrictionType = 'none',
            usageRestrictionLimit = null
        } = req.body;

        // Validação dos campos obrigatórios
        const validationError = validateProductData(req.body);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        // Validação adicional para restrições de uso
        if (usageRestrictionType !== 'none' && !usageRestrictionLimit) {
            return res.status(400).json({ 
                success: false, 
                error: 'Quando há restrição de uso, o limite deve ser informado' 
            });
        }

        if (usageRestrictionLimit && usageRestrictionLimit < 1) {
            return res.status(400).json({ 
                success: false, 
                error: 'O limite de uso deve ser maior que zero' 
            });
        }

        // Criação do novo produto
        const newProduct = await Product.create({ 
            name, 
            credit, 
            validateDate, 
            productTypeId, 
            value, 
            active,
            usageRestrictionType,
            usageRestrictionLimit
        });
        
        return res.status(201).json({ 
            success: true, 
            message: 'Produto criado com sucesso', 
            id: newProduct.id,
            data: newProduct
        });
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

export const getFilteredProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { page = 1, pageSize = 10, productTypeId } = req.query;

        // Configurar paginação
        const limit = parseInt(pageSize as string, 10); // Número de registros por página
        const offset = (parseInt(page as string, 10) - 1) * limit; // Deslocamento

        // Construir a consulta de filtro
        const whereClause: any = {};

        // Se o productTypeId for passado e não for null ou undefined, adiciona o filtro
        if (productTypeId !== undefined && productTypeId !== 'null') {
            whereClause.productTypeId = productTypeId; // Adiciona o filtro para o tipo de produto
        }

        // Busca com paginação e relacionamentos
        const { rows: products, count: totalRecords } = await Product.findAndCountAll({
            where: whereClause, // Filtro condicional
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
        const { 
            name, 
            credit, 
            validateDate, 
            productTypeId, 
            value, 
            active,
            purchaseLimit,
            usageRestrictionType,
            usageRestrictionLimit
        } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).send('Produto não encontrado');
        }

        // Validação adicional para restrições de uso
        if (usageRestrictionType !== 'none' && !usageRestrictionLimit) {
            return res.status(400).json({ 
                success: false, 
                error: 'Quando há restrição de uso, o limite deve ser informado' 
            });
        }

        if (usageRestrictionLimit && usageRestrictionLimit < 1) {
            return res.status(400).json({ 
                success: false, 
                error: 'O limite de uso deve ser maior que zero' 
            });
        }

        // Atualizar campos
        product.name = name || product.name;
        product.credit = credit || product.credit;
        product.validateDate = validateDate || product.validateDate;
        product.productTypeId = productTypeId || product.productTypeId;
        product.value = value || product.value;
        product.active = active !== undefined ? active : product.active;
        product.purchaseLimit = purchaseLimit !== undefined ? purchaseLimit : product.purchaseLimit;
        product.usageRestrictionType = usageRestrictionType || product.usageRestrictionType;
        product.usageRestrictionLimit = usageRestrictionLimit !== undefined ? usageRestrictionLimit : product.usageRestrictionLimit;

        await product.save();

        return res.status(200).json({
            success: true,
            message: 'Produto atualizado com sucesso',
            data: product
        });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        return res.status(500).send('Erro ao atualizar produto');
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
function validateProductData(data: any): string | null {
    const { name, credit, validateDate, productTypeId, value } = data;

    if (!name || typeof name !== 'string') {
        return 'Nome do produto é obrigatório e deve ser uma string.';
    }
    if (credit === undefined || typeof credit !== 'number') {
        return 'Créditos são obrigatórios e devem ser um número.';
    }
    if (validateDate === undefined || typeof validateDate !== 'number') {
        return 'Data de validade é obrigatória e deve ser um número.';
    }
    if (!productTypeId || typeof productTypeId !== 'number') {
        return 'Tipo de produto é obrigatório e deve ser um número.';
    }
    if (value === undefined || typeof value !== 'number') {
        return 'Valor é obrigatório e deve ser um número.';
    }

    return null; // Se tudo estiver válido
}
