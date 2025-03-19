import { Request, Response } from 'express';
import WaitingList from '../models/WaitingList.model';
import ClassStudent from '../models/ClassStudent.model';
import Class from '../models/Class.model';
import sequelize from '../config/database';
import { Op } from 'sequelize';

export const addToWaitingList = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { studentId, classId } = req.body;

        // Verificar se a aula existe
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

        // Verificar se a aula já está cheia
        const enrolledCount = await ClassStudent.count({ where: { classId } });
        if (enrolledCount < classData.limit) {
            return res.status(400).json({ message: 'Ainda há vagas na aula, inscrição direta disponível.' });
        }

        // Verificar se o aluno já está na lista de espera
        const alreadyInWaitingList = await WaitingList.findOne({
            where: { studentId, classId }
        });

        if (alreadyInWaitingList) {
            return res.status(400).json({ message: 'Aluno já está na lista de espera.' });
        }

        // Definir a ordem do aluno na fila (última posição)
        const lastOrder = await WaitingList.max('order', { where: { classId } }) || 0;
        const newOrder = (Number(lastOrder) || 0) + 1;

        // Adicionar aluno à lista de espera
        const waitingEntry = await WaitingList.create({ studentId, classId, order: newOrder });

        return res.status(201).json({
            success: true,
            message: 'Aluno adicionado à lista de espera com sucesso.',
            data: waitingEntry
        });

    } catch (error) {
        console.error('Erro ao adicionar aluno à lista de espera:', error);
        return res.status(500).json({ success: false, message: 'Erro ao adicionar aluno à lista de espera' });
    }
};


export const promoteFromWaitingList = async (classId: number): Promise<void> => {
    try {
        const firstInLine = await WaitingList.findOne({
            where: { classId },
            order: [['order', 'ASC']]
        });

        if (!firstInLine) {
            console.log('Nenhum aluno na lista de espera.');
            return;
        }

        // Criar entrada na tabela ClassStudent para adicionar o aluno
        await ClassStudent.create({
            classId: firstInLine.classId,
            studentId: firstInLine.studentId
        });

        // Remover aluno da lista de espera
        await firstInLine.destroy();

        console.log(`Aluno ${firstInLine.studentId} foi movido da lista de espera para a aula.`);

    } catch (error) {
        console.error('Erro ao promover aluno da lista de espera:', error);
    }
};


export const removeFromWaitingList = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { studentId, classId } = req.body;

        // Verificar se o aluno está na lista de espera
        const entry = await WaitingList.findOne({ where: { studentId, classId } });
        if (!entry) {
            return res.status(404).json({ message: 'Aluno não encontrado na lista de espera.' });
        }

        // Remover aluno da lista de espera
        await entry.destroy();

        // Ajustar ordem da lista de espera
        await WaitingList.update({ order: sequelize.literal('order - 1') }, {
            where: {
                classId,
                order: { [Op.gt]: entry.order }
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Aluno removido da lista de espera.'
        });

    } catch (error) {
        console.error('Erro ao remover aluno da lista de espera:', error);
        return res.status(500).json({ success: false, message: 'Erro ao remover aluno da lista de espera' });
    }
};
