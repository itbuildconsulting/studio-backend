import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken';
import {
    validateCoupon,
    listCoupons,
    getCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon,
} from '../controllers/couponController';

const router = Router();

// Público — usado pelo app e web antes de finalizar o checkout
router.post('/validate', validateCoupon);

// Admin autenticado
router.get('/', authenticateToken, listCoupons);
router.get('/:id', authenticateToken, getCoupon);
router.post('/', authenticateToken, createCoupon);
router.put('/:id', authenticateToken, updateCoupon);
router.delete('/:id', authenticateToken, deleteCoupon);

export default router;
