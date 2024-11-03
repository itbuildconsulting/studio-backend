import { Request, Response} from 'express';
import ProductType from '../models/ProductType.model';
import Place from '../models/Place.model';

// CREATE
export const createProductType = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name, active, placeId } = req.body;

        // Chama a função de validação
        const validation = await validateProductTypeData(name, active, placeId);
        if (!validation.success) {
            return res.status(400).json(validation); // Retorna o erro de validação
        }

        // Criação do novo ProductType
        const newProductType = await ProductType.create({ name, active, placeId });
        return res.status(201).json({
            success: true,
            message: 'Tipo de Produto criado com sucesso',
            data: newProductType
        });
    } catch (error) {
        console.error('Erro ao criar tipo de produto:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao criar tipo de produto'
        });
    }
};

// READ ALL
export const getAllProductTypes = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const productTypes = await ProductType.findAll({
            include: [
                {
                    model: Place,
                    as: 'place',  // Especificando o alias correto usado na associação
                    attributes: ['name']  // Inclui apenas o campo 'name' do Place
                }
            ]
        });
        return res.status(200).json(productTypes);
    } catch (error) {
        console.error('Erro ao buscar Tipos de Produtos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar Tipos de Produtos'
        });
    }
};

// READ Dropdown
export const getDropdownProductTypes = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const dropdownData = await ProductType.findAll({
            attributes: ['id', 'name'],
            include: [{
                model: Place,
                attributes: ['name'],
                as: 'place'  // Use o alias correto, se necessário
            }]
        });
        return res.status(200).json(dropdownData);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar Tipos de Produtos'
        });
    }
};

// READ BY ID
export const getProductTypeById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const productType = await ProductType.findByPk(id);
        if (!productType) {
            return res.status(404).json({
                success: false,
                error: 'Tipo de Produto não encontrado'
            });
        }
        return res.status(200).json(productType);
    } catch (error) {
        console.error('Erro ao buscar Tipo de Produto:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar Tipo de Produto'
        });
    }
};

// UPDATE
export const updateProductType = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { name, active, placeId } = req.body;

        // Verifica se o productType existe
        const productType = await ProductType.findByPk(id);
        if (!productType) {
            return res.status(404).json({
                success: false,
                error: 'Tipo de Produto não encontrado'
            });
        }

        // Chama a função de validação
        const validation = await validateProductTypeData(name, active, placeId);
        if (!validation.success) {
            return res.status(400).json(validation); // Retorna o erro de validação
        }

        // Atualiza os campos do productType
        productType.name = name;
        productType.active = active;
        productType.placeId = placeId;
        await productType.save();

        return res.status(200).json({
            success: true,
            message: 'Tipo de Produto atualizado com sucesso',
            data: productType
        });
    } catch (error) {
        console.error('Erro ao atualizar Tipo de Produto:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar Tipo de Produto'
        });
    }
};

// DELETE
export const deleteProductType = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        // Verifica se o ProductType existe
        const productType = await ProductType.findByPk(id);
        if (!productType) {
            return res.status(404).json({
                success: false,
                error: 'Tipo de Produto não encontrado'
            });
        }

        // Altera o campo 'active' para false (0) em vez de excluir
        productType.active = 0; // Desativa o registro
        await productType.save();

        return res.status(200).json({
            success: true,
            message: 'Tipo de Produto desativado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao desativar Tipo de Produto:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao desativar Tipo de Produto'
        });
    }
};


export const validateProductTypeData = async (name: string, active: any, placeId: number) => {
    if (!name || name.trim() === "" || active === undefined || !placeId) {
        return {
            success: false,
            error: 'Os campos são obrigatórios e não podem estar vazios'
        };
    }

    // Verifica se o placeId existe na tabela Place
    const placeExists = await Place.findByPk(placeId);
    if (!placeExists) {
        return {
            success: false,
            error: 'O Local fornecido não existe'
        };
    }

    return { success: true };
};