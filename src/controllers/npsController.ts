import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import Nps from '../models/Nps.model';
import Class from '../models/Class.model';
import Person from '../models/Person.model';

// ── Submeter avaliação ────────────────────────────────────────────────────────

export const submitNps = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { classId, studentId, score, comment } = req.body;

        if (score === undefined || score < 0 || score > 10) {
            return res.status(400).json({ success: false, error: 'Nota deve ser entre 0 e 10.' });
        }

        const [entry, created] = await Nps.findOrCreate({
            where: { classId, studentId },
            defaults: { classId, studentId, score, comment: comment || null },
        });

        if (!created) {
            await entry.update({ score, comment: comment || null });
        }

        return res.status(200).json({ success: true, data: entry });
    } catch (error) {
        console.error('[NPS] Erro ao salvar avaliação:', error);
        return res.status(500).json({ success: false, error: 'Erro ao salvar avaliação.' });
    }
};

// ── Relatório NPS ─────────────────────────────────────────────────────────────

export const getNpsReport = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { months = 3 } = req.query;
        const since = new Date();
        since.setMonth(since.getMonth() - Number(months));

        const entries = await Nps.findAll({
            where: { createdAt: { [Op.gte]: since } },
            raw: true,
        });

        const total = entries.length;

        if (total === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    npsScore: null,
                    total: 0,
                    promoters: { count: 0, pct: 0 },
                    passives:  { count: 0, pct: 0 },
                    detractors:{ count: 0, pct: 0 },
                    distribution: Array.from({ length: 11 }, (_, i) => ({ score: i, count: 0 })),
                    averageScore: null,
                    recentFeedback: [],
                },
            });
        }

        const promoters  = entries.filter(e => e.score >= 9).length;
        const passives   = entries.filter(e => e.score >= 7 && e.score <= 8).length;
        const detractors = entries.filter(e => e.score <= 6).length;
        const npsScore   = Math.round((promoters / total) * 100 - (detractors / total) * 100);
        const averageScore = parseFloat((entries.reduce((s, e) => s + e.score, 0) / total).toFixed(1));

        const distribution = Array.from({ length: 11 }, (_, i) => ({
            score: i,
            count: entries.filter(e => e.score === i).length,
        }));

        // Feedbacks recentes com detalhes de aula e aluno
        const recentEntries = await Nps.findAll({
            where: { createdAt: { [Op.gte]: since } },
            order: [['createdAt', 'DESC']],
            limit: 50,
            raw: true,
        });

        const classIds   = [...new Set(recentEntries.map(e => e.classId))];
        const studentIds = [...new Set(recentEntries.map(e => e.studentId))];

        const [classes, students] = await Promise.all([
            Class.findAll({ where: { id: { [Op.in]: classIds } }, attributes: ['id', 'date', 'title'], raw: true }),
            Person.findAll({ where: { id: { [Op.in]: studentIds } }, attributes: ['id', 'name'], raw: true }),
        ]);

        const classMap   = new Map((classes   as any[]).map(c => [c.id, c]));
        const studentMap = new Map((students  as any[]).map(s => [s.id, s]));

        const recentFeedback = recentEntries.map(e => ({
            id:          e.id,
            score:       e.score,
            comment:     e.comment || null,
            createdAt:   e.createdAt,
            className:   classMap.get(e.classId)?.title  ?? '—',
            classDate:   classMap.get(e.classId)?.date   ?? null,
            studentName: studentMap.get(e.studentId)?.name ?? '—',
        }));

        return res.status(200).json({
            success: true,
            data: {
                npsScore,
                total,
                promoters:  { count: promoters,  pct: Math.round((promoters  / total) * 100) },
                passives:   { count: passives,   pct: Math.round((passives   / total) * 100) },
                detractors: { count: detractors, pct: Math.round((detractors / total) * 100) },
                distribution,
                averageScore,
                recentFeedback,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Erro ao buscar relatório NPS.' });
    }
};
