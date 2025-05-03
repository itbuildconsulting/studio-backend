import { Router } from 'express';
import { authenticateToken } from '../core/token/authenticateToken'; // Middleware de autenticação
import { 
    createPerson, 
    getAllPersons, 
    getByCriteriaEmployee, 
    getByCriteriaStudent, 
    getDropdownEmployee, 
    getDropdownStudent, 
    getPersonById, 
    updatePerson, 
    deletePerson, 
    validateUserExists
} from '../controllers/personController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Persons
 *   description: Operações com pessoas
 */

/**
 * @swagger
 * /persons:
 *   post:
 *     summary: Criar pessoa (Aluno/Professor). Only Authenticated
 *     tags: [Persons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               identity:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: "2019-05-17"
 *               active:
 *                 type: boolean
 *               address:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               height:
 *                 type: integer
 *               weight:
 *                 type: integer
 *               other:
 *                 type: string
 *               password:
 *                 type: string
 *               rule:
 *                 type: string
 *               frequency:
 *                 type: string
 *               employee:
 *                 type: boolean
 *               employee_level:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pessoa (Aluno/Professor) criada
 *       401:
 *         description: Erro ao criar pessoa
 */
router.post('/',createPerson);

/**
 * @swagger
 * /persons:
 *   get:
 *     summary: Retorna a lista de pessoas. Only Authenticated
 *     tags: [Persons]
 *     responses:
 *       200:
 *         description: Lista de pessoas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 */
router.get('/', authenticateToken, getAllPersons);

/**
 * @swagger
 * /persons/employee/filter:
 *   post:
 *     summary: Retorna a lista de funcionários filtrada por critérios. Only Authenticated
 *     tags: [Persons]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Lista de funcionários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   identity:
 *                     type: string
 */
router.post('/employee/filter', authenticateToken, getByCriteriaEmployee);

/**
 * @swagger
 * /persons/student/filter:
 *   post:
 *     summary: Retorna a lista de estudantes filtrada por critérios. Only Authenticated
 *     tags: [Persons]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Lista de estudantes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   identity:
 *                     type: string
 */
router.post('/student/filter', authenticateToken, getByCriteriaStudent);

/**
 * @swagger
 * /persons/employee/dropdown:
 *   get:
 *     summary: Retorna a lista de funcionários (dropdown). Only Authenticated
 *     tags: [Persons]
 *     responses:
 *       200:
 *         description: Lista de funcionários no formato dropdown
 */
router.get('/employee/dropdown', authenticateToken, getDropdownEmployee);

/**
 * @swagger
 * /persons/student/dropdown:
 *   get:
 *     summary: Retorna a lista de estudantes (dropdown). Only Authenticated
 *     tags: [Persons]
 *     responses:
 *       200:
 *         description: Lista de estudantes no formato dropdown
 */
router.get('/student/dropdown', authenticateToken, getDropdownStudent);

/**
 * @swagger
 * /persons/{id}:
 *   get:
 *     summary: Retorna os detalhes de uma pessoa por ID. Only Authenticated
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da pessoa
 *     responses:
 *       200:
 *         description: Detalhes da pessoa retornados
 */
router.get('/:id', authenticateToken, getPersonById);

/**
 * @swagger
 * /persons/{id}:
 *   put:
 *     summary: Atualizar os dados de uma pessoa por ID. Only Authenticated
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da pessoa a ser atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Pessoa atualizada com sucesso
 *       401:
 *         description: Erro ao atualizar pessoa
 */
router.put('/:id', authenticateToken, updatePerson);

/**
 * @swagger
 * /persons/{id}:
 *   delete:
 *     summary: Deletar pessoa por ID. Only Authenticated
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da pessoa a ser deletada
 *     responses:
 *       200:
 *         description: Pessoa deletada com sucesso
 *       401:
 *         description: Erro ao deletar pessoa
 */
router.post('/remove/:id', authenticateToken, deletePerson);

router.post('/validateUserExists', authenticateToken, validateUserExists);

export default router;
