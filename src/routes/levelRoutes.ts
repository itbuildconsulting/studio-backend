import { Router } from 'express';
import { createLevel, updateLevel, deleteLevel, getAllLevels } from '../controllers/levelController';

const router = Router();

// Criar novo nível
router.post('/', createLevel);

// Atualizar um nível
router.put('/:id', updateLevel);

// Deletar um nível
router.delete('/:id', deleteLevel);

// Listar todos os níveis
router.get('/', getAllLevels);

export default router;
