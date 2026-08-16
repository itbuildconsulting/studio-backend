import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Coupon from '../models/Coupon.model';
import CouponUsage from '../models/CouponUsage.model';

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function validateAndApplyCoupon(
    code: string,
    studentId: number,
    productIds: number[],
    subtotal: number,
): Promise<{ valid: true; discountAmount: number; coupon: Coupon } | { valid: false; error: string }> {
    const coupon = await Coupon.findOne({
        where: { code: code.toUpperCase().trim(), active: true },
    });

    if (!coupon) return { valid: false, error: 'Cupom inválido ou inativo.' };

    if (coupon.expiresAt && new Date() > coupon.expiresAt)
        return { valid: false, error: 'Cupom expirado.' };

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
        return { valid: false, error: 'Limite de usos do cupom atingido.' };

    const studentUsages = await CouponUsage.count({ where: { couponId: coupon.id, studentId } });
    if (studentUsages >= coupon.maxUsesPerStudent)
        return { valid: false, error: 'Você já utilizou este cupom.' };

    if (coupon.productIds) {
        const allowed: number[] = JSON.parse(coupon.productIds);
        const hasValid = productIds.some(id => allowed.includes(id));
        if (!hasValid) return { valid: false, error: 'Cupom não válido para os produtos selecionados.' };
    }

    const discountAmount =
        coupon.type === 'percent'
            ? Math.min((subtotal * Number(coupon.value)) / 100, subtotal)
            : Math.min(Number(coupon.value), subtotal);

    return { valid: true, discountAmount, coupon };
}

export async function registerCouponUsage(couponId: number, studentId: number, transactionId: string) {
    await Promise.all([
        CouponUsage.create({ couponId, studentId, transactionId }),
        Coupon.increment('usedCount', { where: { id: couponId } }),
    ]);
}

// ── Validate (público — chamado pelo app/web antes do checkout) ───────────────

export const validateCoupon = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { code, studentId, productIds = [], subtotal = 0 } = req.body;
        if (!code || !studentId) return res.status(400).json({ success: false, error: 'code e studentId são obrigatórios.' });

        const result = await validateAndApplyCoupon(code, Number(studentId), productIds, Number(subtotal));
        if (result.valid === false) return res.status(422).json({ success: false, error: result.error });

        return res.json({
            success: true,
            discount: {
                type: result.coupon.type,
                value: Number(result.coupon.value),
                amount: result.discountAmount,
            },
        });
    } catch (err) {
        console.error('[Coupon] validate error:', err);
        return res.status(500).json({ success: false, error: 'Erro ao validar cupom.' });
    }
};

// ── CRUD (admin autenticado) ──────────────────────────────────────────────────

export const listCoupons = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
        return res.json({ success: true, data: coupons });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Erro ao listar cupons.' });
    }
};

export const getCoupon = async (req: Request, res: Response): Promise<Response> => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, error: 'Cupom não encontrado.' });
        return res.json({ success: true, data: coupon });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Erro ao buscar cupom.' });
    }
};

export const createCoupon = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { code, type, value, expiresAt, maxUses, maxUsesPerStudent, productIds } = req.body;
        if (!code || !type || value === undefined)
            return res.status(400).json({ success: false, error: 'code, type e value são obrigatórios.' });

        const coupon = await Coupon.create({
            code: String(code).toUpperCase().trim(),
            type,
            value: Number(value),
            expiresAt: expiresAt ?? null,
            maxUses: maxUses ?? null,
            maxUsesPerStudent: maxUsesPerStudent ?? 1,
            productIds: productIds ? JSON.stringify(productIds) : null,
            active: true,
            usedCount: 0,
        });
        return res.status(201).json({ success: true, data: coupon });
    } catch (err: any) {
        if (err?.name === 'SequelizeUniqueConstraintError')
            return res.status(409).json({ success: false, error: 'Já existe um cupom com este código.' });
        console.error('[Coupon] create error:', err);
        return res.status(500).json({ success: false, error: 'Erro ao criar cupom.' });
    }
};

export const updateCoupon = async (req: Request, res: Response): Promise<Response> => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, error: 'Cupom não encontrado.' });

        const { code, type, value, expiresAt, maxUses, maxUsesPerStudent, productIds, active } = req.body;
        await coupon.update({
            ...(code !== undefined && { code: String(code).toUpperCase().trim() }),
            ...(type !== undefined && { type }),
            ...(value !== undefined && { value: Number(value) }),
            ...(expiresAt !== undefined && { expiresAt }),
            ...(maxUses !== undefined && { maxUses }),
            ...(maxUsesPerStudent !== undefined && { maxUsesPerStudent }),
            ...(productIds !== undefined && { productIds: productIds ? JSON.stringify(productIds) : null }),
            ...(active !== undefined && { active }),
        });
        return res.json({ success: true, data: coupon });
    } catch (err) {
        console.error('[Coupon] update error:', err);
        return res.status(500).json({ success: false, error: 'Erro ao atualizar cupom.' });
    }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<Response> => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, error: 'Cupom não encontrado.' });
        await coupon.update({ active: false });
        return res.json({ success: true, message: 'Cupom desativado.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Erro ao desativar cupom.' });
    }
};
