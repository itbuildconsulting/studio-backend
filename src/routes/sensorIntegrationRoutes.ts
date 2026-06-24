import { Router } from 'express';
import { validateServiceKey } from '../core/token/validateServiceKey';
import { getAllClasses, getClassById } from '../controllers/classController';
import { getPersonById } from '../controllers/personController';

// Rotas espelhadas de /class e /persons, mas autenticadas por chave de serviço
// (header x-service-key) em vez de JWT — usadas pelo sensor-service.
const router = Router();

router.post('/class/filter', validateServiceKey, getAllClasses);
router.get('/class/:id', validateServiceKey, getClassById);
router.get('/persons/:id', validateServiceKey, getPersonById);

export default router;
