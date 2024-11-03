import { Request, Response} from 'express';
import Place from '../models/Place.model'

// CREATE
export const createPlace = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name, address, active } = req.body;

        // Chama a função de validação
        const validation = validatePlaceData(name, address, active);
        if (!validation.success) {
            return res.status(400).json(validation); // Retorna o erro de validação
        }

        // Criação do novo Place
        const newPlace = await Place.create({ name, address, active });
        return res.status(201).json({
            success: true,
            message: 'Local criado com sucesso',
            data: newPlace
        });
    } catch (error) {
        console.error('Erro ao criar local:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao criar local'
        });
    }
};
// READ ALL
export const getAllPlaces = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const places = await Place.findAll();
        return res.status(200).json(places);
    } catch (error) {
        console.error('Erro ao buscar locais:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar locais' 
        });
    }
};

// READ BY ID
export const getPlaceById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const place = await Place.findByPk(id);
        if (!place) {
            return res.status(404).json({ 
                success: false, 
                error: 'Local não encontrado' 
            });
        }
        return res.status(200).json(place);
    } catch (error) {
        console.error('Erro ao buscar local:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar local' 
        });
    }
};

// UPDATE
export const updatePlace = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { name, active, address } = req.body;
        const place = await Place.findByPk(id);
        if (!place) {
            return res.status(404).json({ 
                success: false, 
                error: 'Local não encontrado' 
            });
        }
        place.name = name;
        place.active = active;
        place.address = address;
        await place.save();
        return res.status(200).json(place);
    } catch (error) {
        console.error('Erro ao atualizar local:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erro ao atualizar local' 
        });
    }
};

// DELETE
export const deletePlace = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const place = await Place.findByPk(id);

        if (!place) {
            return res.status(404).json({ 
                success: false, 
                error: 'Local não encontrado' 
            });
        }

        // Atualiza o status 'active' para 0 (inativo)
        place.active = 0;  // Garantimos que a alteração seja apenas lógica
        await place.save(); // Salva a alteração no banco de dados

        return res.status(200).json({ 
            success: true, 
            message: 'Local desativado com sucesso' 
        });
    } catch (error) {
        console.error('Erro ao desativar local:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erro ao desativar local' 
        });
    }
};


const validatePlaceData = (name: string, address: string, active: any) => {
    if (!name || name.trim() === "" || !address || address.trim() === "" || active === undefined) {
        return {
            success: false,
            error: 'Os campos name, address e active são obrigatórios e não podem estar vazios'
        };
    }
    return {
        success: true
    };
};