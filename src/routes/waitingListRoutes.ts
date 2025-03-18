import express from 'express';
import { addToWaitingList, promoteFromWaitingList, removeFromWaitingList } from '../controllers/waitingListController';

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

// Rota para remover aluno da lista de espera
router.delete('/remove', removeFromWaitingList);

export default router;