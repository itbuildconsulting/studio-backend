import { Router } from 'express';

import { authenticateToken } from '../core/token/authenticateToken';
import { createConfig, getConfig, updateConfig } from '../controllers/configController';

const router = Router();

router.post('/create', authenticateToken, createConfig);

router.get('/read', authenticateToken, getConfig);

router.post('/update', authenticateToken, updateConfig);

router.get('/delete', authenticateToken, getConfig);

export default router;