import { Request, Response } from 'express';
import Class from '../models/Class.model';
import ClassStudent from '../models/ClassStudent.model';
import { authenticateToken } from '../core/token/authenticateToken';
import moment from 'moment';
import Bike from '../models/Bike.model';

// CREATE
export const createClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const {
            date = moment(req.body.date, 'MM/DD/YYYY').format('YYYY-MM-DD'),
            time,
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productId,
            bikes, // Array de objetos com { studentId, bikeNumber }
            active
        } = req.body;

        // Criação da aula
        const newClass = await Class.create({
            date,
            time,
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productId,
            active
        });

        // Processar cada bike do array `bikes` e garantir que as bikes existam na tabela `Bike`
        if (bikes && bikes.length > 0) {
            const classId = newClass.id;

            for (const bike of bikes) {
                const { studentId, bikeNumber } = bike;

                // Verifica se a bike já existe na tabela 'Bike'
                let bikeRecord = await Bike.findOne({ where: { bikeNumber } });
                if (!bikeRecord) {
                    // Cria a bike se ela não existir
                    bikeRecord = await Bike.create({ bikeNumber, status: 'in_use', studentId });
                } else {
                    // Atualiza o status da bike para 'in_use'
                    bikeRecord.status = 'in_use';
                    await bikeRecord.save();
                }

                // Cria a associação na tabela `ClassStudent`
                await ClassStudent.create({
                    classId,
                    PersonId: teacherId,
                    studentId,
                    bikeId: bikeRecord.bikeNumber
                });
            }
        }

        return res.status(201).json({ success: true, message: 'Aula e bikes associadas criadas com sucesso', classId: newClass.id });
    } catch (createError) {
        console.error('Erro ao criar aula:', createError);
        return res.status(500).json({
            success: false,
            data: createError,
            error: 'Erro ao criar aula'
        });
    }
};
 
// READ
export const getAllClasses = async (_req: Request, res: Response): Promise<void | Response> => {
    try {
        authenticateToken(_req, res, async () => {
            try {
                const classes = await Class.findAll();
                return res.status(200).json(classes); // Retorno explícito dentro do callback
            } catch (findError) {
                console.error('Erro ao buscar aulas:', findError);
                return res.status(500).send('Erro ao buscar aulas');
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        return res.status(401).send('Token inválido');
    }
};

export const getClassById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.params.id;
        const classData = await Class.findByPk(id);
        if (!classData) {
            return res.status(404).send('Aula não encontrada');
        }
        return res.status(200).json(classData);
    } catch (error) {
        console.error('Erro ao buscar aula:', error);
        return res.status(500).send('Erro ao buscar aula');
    }
};

// UPDATE
export const updateClass = async (_req: Request, res: Response): Promise<Response> => {
    return res.status(200).send('Aula excluída com sucesso');
};

// DELETE
export const deleteClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.params.id;
        const classData = await Class.findByPk(id);
        if (!classData) {
            return res.status(404).send('Aula não encontrada');
        }
        await classData.destroy();
        return res.status(200).send('Aula excluída com sucesso');
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        return res.status(500).send('Erro ao excluir aula');
    }
};