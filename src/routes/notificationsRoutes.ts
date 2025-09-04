import { Router } from 'express';
import { sendPushToPersons } from '../services/pushService';
import { authenticateToken } from '../core/token/authenticateToken';

const router = Router();

router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { personIds, title, body, data } = req.body;
    if (!Array.isArray(personIds) || personIds.length === 0) {
      return res.status(400).json({ success: false, message: 'personIds deve ser um array com pelo menos 1 id' });
    }
    const result = await sendPushToPersons(personIds, { title, body, data });
    return res.json({ success: true, ...result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false });
  }
});

export default router;
