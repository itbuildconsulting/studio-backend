import { Request, Response } from 'express';
import Class from '../models/Class.model';
import ClassStudent from '../models/ClassStudent.model';
import { authenticateToken } from '../core/token/authenticateToken';
import moment from 'moment';
import Bike from '../models/Bike.model';
import { Op } from 'sequelize';
import Person from '../models/Person.model';
import ProductType from '../models/ProductType.model';

// CREATE
export const createClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const validation = validateClassData(req.body);

        // Verificar se os dados são válidos
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const {
            date,
            time,
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productTypeId,
            bikes,
            active,
        } = req.body;

        // Formatar a data corretamente
        const formattedDate = moment(date, 'MM/DD/YYYY').format('YYYY-MM-DD');

        // Criação da aula
        const newClass = await Class.create({
            date: formattedDate,
            time,
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productTypeId,
            active,
        });

        // Processar cada bike do array `bikes` e garantir que as bikes existam na tabela `Bike`
        if (bikes && bikes.length > 0) {
            const classId = newClass.id;

            for (const bike of bikes) {
                const { studentId, bikeNumber } = bike;

                let bikeRecord = await Bike.findOne({ where: { bikeNumber } });
                if (!bikeRecord) {
                    bikeRecord = await Bike.create({ bikeNumber, status: 'in_use', studentId });
                } else {
                    bikeRecord.status = 'in_use';
                    await bikeRecord.save();
                }

                await ClassStudent.create({
                    classId,
                    PersonId: teacherId,
                    studentId,
                    bikeId: bikeRecord.bikeNumber,
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Aula e bikes associadas criadas com sucesso',
            classId: newClass.id,
        });
    } catch (createError) {
        console.error('Erro ao criar aula:', createError);
        return res.status(500).json({
            success: false,
            data: createError,
            error: 'Erro ao criar aula',
        });
    }
};

export const getAllClasses = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        authenticateToken(req, res, async () => {
            try {
                const { date, time, productType, teacherId, page = 1, pageSize = 10 } = req.body;

                // Critérios de busca dinâmica para aulas
                const criteria: any = {};

                if (date) {
                    criteria.date = date; // Busca por data exata
                }

                if (time) {
                    criteria.time = time; // Busca por hora exata
                }

                if (productType) {
                    criteria.productTypeId = productType; // Filtro por ID do tipo de produto
                }

                if (teacherId) {
                    criteria.teacherId = teacherId; // Filtro por ID do professor
                }

                // Configurar paginação
                const limit = parseInt(pageSize, 10); // Número de registros por página
                const offset = (parseInt(page, 10) - 1) * limit; // Deslocamento

                // Busca as aulas com os critérios aplicados e paginação
                const { rows: classes, count: totalRecords } = await Class.findAndCountAll({
                    where: criteria,
                    limit,
                    offset,
                });

                if (!classes || classes.length === 0) {
                    return res.status(404).send('Nenhuma aula encontrada');
                }

                // Buscar os nomes manualmente
                const enrichedClasses = await Promise.all(
                    classes.map(async (classItem) => {
                        const productType = await ProductType.findByPk(classItem.productTypeId, {
                            attributes: ['id', 'name'],
                        });

                        const teacher = await Person.findByPk(classItem.teacherId, {
                            attributes: ['id', 'name'],
                        });

                        return {
                            ...classItem.toJSON(),
                            productType: productType ? productType.name : null,
                            teacher: teacher ?  teacher.name : null,
                        };
                    })
                );

                return res.status(200).json({
                    success: true,
                    data: enrichedClasses,
                    pagination: {
                        totalRecords,
                        totalPages: Math.ceil(totalRecords / limit),
                        currentPage: parseInt(page, 10),
                        pageSize: limit,
                    },
                });
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

        // Buscar dados da aula pelo ID
        const classData = await Class.findByPk(id);
        if (!classData) {
            return res.status(404).send('Aula não encontrada');
        }

        // Buscar as bicicletas associadas à aula
        const bikes = await Bike.findAll({
            where: { classId: id },
            attributes: ['bikeNumber', 'status', 'studentId'], // Inclui studentId para buscar o nome do aluno, se houver
        });

        // Para cada bicicleta, buscar o nome do aluno associado, se houver
        const formattedBikes = await Promise.all(
            bikes.map(async (bike) => {
                let studentName = null;

                if (bike.studentId) {
                    // Buscar o nome do aluno associado, se houver um studentId
                    const student = await Person.findByPk(bike.studentId, {
                        attributes: ['name'], // Buscar apenas o nome do aluno
                    });
                    studentName = student?.name || null;
                }

                return {
                    bikeNumber: bike.bikeNumber,
                    status: bike.status, // Status da bicicleta (ex.: disponível, em uso, manutenção)
                    studentName, // Nome do aluno associado (ou null se não houver)
                };
            })
        );

        // Retornar os dados da aula com as bicicletas
        return res.status(200).json({
            ...classData.toJSON(), // Converte os dados da aula para JSON
            bikes: formattedBikes, // Adiciona as bicicletas ao retorno
        });
    } catch (error) {
        console.error('Erro ao buscar aula:', error);
        return res.status(500).send('Erro ao buscar aula');
    }
};

// UPDATE
export const updateClass = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.params.id; // ID da aula a ser editada
        const {
            date,
            time,
            teacherId,
            limit,
            hasCommission,
            kickbackRule,
            kickback,
            productTypeId,
            bikes, // Array atualizado de { studentId, bikeNumber }
            active,
        } = req.body;

        // Verificar se a aula existe
        const classData = await Class.findByPk(id);
        if (!classData) {
            return res.status(404).json({ success: false, message: 'Aula não encontrada' });
        }

        // **Validação dos Dados**
        const validation = validateClassData({ date, time, teacherId, productTypeId });
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        // Atualizar os campos da aula
        await classData.update({
            date: date || classData.date,
            time: time || classData.time,
            teacherId: teacherId || classData.teacherId,
            limit: limit || classData.limit,
            hasCommission: hasCommission !== undefined ? hasCommission : classData.hasCommission,
            kickbackRule: kickbackRule || classData.kickbackRule,
            kickback: kickback || classData.kickback,
            productTypeId: productTypeId || classData.productTypeId,
            active: active !== undefined ? active : classData.active,
        });

        // Atualizar as associações de alunos e bicicletas
        if (bikes && bikes.length >= 0) {
            const classId = classData.id;

            // Obter todos os registros existentes em ClassStudent para esta aula
            const existingClassStudents = await ClassStudent.findAll({ where: { classId } });

            // Processar as novas associações
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
                    bikeRecord.studentId = studentId || null; // Atualiza o aluno associado, se houver
                    await bikeRecord.save();
                }

                // Verificar se a associação já existe
                const existingAssociation = existingClassStudents.find(
                    (cs) => cs.bikeId === bikeRecord.bikeNumber
                );

                if (!existingAssociation) {
                    // Criar nova associação em ClassStudent
                    await ClassStudent.create({
                        classId,
                        PersonId: teacherId,
                        studentId,
                        bikeId: bikeRecord.bikeNumber,
                    });
                } else {
                    // Atualizar associação existente
                    await existingAssociation.update({
                        studentId,
                        bikeId: bikeRecord.bikeNumber,
                    });
                }
            }

            // Remover associações que não estão mais presentes no array `bikes`
            const bikesToKeep = bikes.map((bike: any) => bike.bikeNumber);
            for (const cs of existingClassStudents) {
                if (!bikesToKeep.includes(cs.bikeId)) {
                    // Remover a associação
                    await cs.destroy();
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Aula e associações atualizadas com sucesso',
            data: classData,
        });
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar aula',
            details: error.message,
        });
    }
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


export const validateClassData = (data: any): { isValid: boolean; message?: string } => {
    const { date, time, teacherId, productTypeId } = data;

    // Validação da data
    if (!date || !moment(date, 'MM/DD/YYYY', true).isValid()) {
        return { isValid: false, message: 'Data inválida ou ausente.' };
    }

    // Validação do horário
    if (!time) {
        return { isValid: false, message: 'Horário é obrigatório.' };
    }

    // Validação do professor
    if (!teacherId) {
        return { isValid: false, message: 'ID do professor é obrigatório.' };
    }

    // Validação do tipo de produto
    if (!productTypeId) {
        return { isValid: false, message: 'Tipo de produto é obrigatório.' };
    }

    // Se todas as validações passarem
    return { isValid: true };
};