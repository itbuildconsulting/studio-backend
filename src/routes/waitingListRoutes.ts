import express from 'express';
import { addToWaitingList, getWaitingListByClass, listMyWaitingListsPost, promoteFromWaitingList, promoteFromWaitingListWithBike, removeFromWaitingList } from '../controllers/waitingListController';
import { authenticateToken } from '../core/token/authenticateToken';

const router = express.Router();

// Rota para adicionar aluno à lista de espera
router.post('/add', addToWaitingList);

// Rota para promover aluno da lista de espera para a aula
router.post('/promote/:classId', (req, res) => {
    const { classId } = req.params;
    promoteFromWaitingList(Number(classId))
        .then(() => res.status(200).json({ message: "Aluno promovido com sucesso!" }))
        .catch(error => res.status(500).json({ error: "Erro ao promover aluno da lista de espera" }));
});

router.post('/mine', authenticateToken, listMyWaitingListsPost);

// Rota para remover aluno da lista de espera
router.delete('/remove', removeFromWaitingList);

router.post('/waitingList/promote', authenticateToken, promoteFromWaitingListWithBike);

router.get('/class/:classId', authenticateToken, getWaitingListByClass);

export default router;