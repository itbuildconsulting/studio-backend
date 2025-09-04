import { Router } from 'express';

import { authenticateToken } from '../core/token/authenticateToken';
import { createConfig, deleteConfig, getConfig, updateConfig, upsertConfig } from '../controllers/configController';

const router = Router();

router.post('/create', authenticateToken, createConfig);

router.get('/read', authenticateToken, getConfig);

router.post('/update', authenticateToken, updateConfig);

router.get('/delete', authenticateToken, deleteConfig);

router.post('/upsertConfig', authenticateToken, upsertConfig);


export default router;