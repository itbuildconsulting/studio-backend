import { Request, Response } from 'express';
import { Op } from 'sequelize'; // Operadores do Sequelize
import Person from '../models/Person.model';

// CREATE
export const createPerson = async (req: Request, res: Response): Promise<Response> => {
    try {
        const {
            name,
            identity,
            email,
            phone,
            birthday,
            height,
            weight,
            other,
            password,
            rule,
            frequency,
            employee,
            employee_level,
            zipCode,
            state,
            city,
            address,
            country,
            active
        } = req.body;
        console.log(req.body)

        // Validação de dados
        const validationError = validatePersonData(req.body);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        const document = identity.replace(/[.\-\/]/g, '');

        // Criação da pessoa
        const newPerson = await Person.create({
            name,
            identity: document,
            email,
            phone,
            birthday,
            height,
            weight,
            other,
            password,
            rule,
            frequency,
            employee,
            employee_level,
            zipCode,
            state,
            city,
            address,
            country,
            active
        });

        return res.status(201).json({
            success: true,
            message: 'Pessoa criada com sucesso',
            id: newPerson.id
        });
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao criar pessoa',
            mesage: error
        });
    }
};

// READ ALL
export const getAllPersons = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const persons = await Person.findAll();
        return res.status(200).json(persons);
    } catch (error) {
        console.error('Erro ao buscar pessoas:', error);
        return res.status(500).json({
            success: false,
            data: error,
            error: 'Erro ao buscar pessoas',
        });
    }
};

// READ BY ID
export const getPersonById = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const person = await Person.findByPk(id);
        if (!person) {
            return res.status(404).send('Pessoa não encontrada');
        }
        return res.status(200).json(person);
    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        return res.status(500).send('Erro ao buscar pessoa');
    }
};

// FILTRAR FUNCIONÁRIOS
export const getByCriteriaEmployee = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, name, identity } = req.body;

        // Critérios básicos: Apenas funcionários
        const criteria: any = { employee: true };

        // Se os campos forem passados, verifica se não estão vazios e adiciona aos critérios
        if (email && email.trim() !== "") criteria.email = email;
        if (name && name.trim() !== "") criteria.name = { [Op.like]: `%${name}%` };
        if (identity && identity.trim() !== "") criteria.identity = identity;

        // Busca pessoas com os critérios fornecidos
        const people = await Person.findAll({ where: criteria });

        if (!people || people.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum funcionário encontrado com os critérios fornecidos'
            });
        }

        return res.status(200).json({
            success: true,
            data: people
        });
    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar funcionários'
        });
    }
};
// FILTRAR ESTUDANTES
export const getByCriteriaStudent = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, name, identity } = req.body;

        // Critérios de busca dinâmica
        const criteria: any = { employee: false }; // Apenas estudantes

        // Adicionar filtros dinâmicos com busca parcial
        if (email) criteria.email = { [Op.like]: `%${email}%` }; // Busca parcial por e-mail
        if (name) criteria.name = { [Op.like]: `%${name}%` }; // Busca parcial por nome
        if (identity) criteria.identity = { [Op.like]: `%${identity}%` }; // Busca parcial por identidade

        // Busca múltiplos registros
        const people = await Person.findAll({ where: criteria });

        if (!people || people.length === 0) {
            return res.status(404).send('Nenhum estudante encontrado');
        }

        return res.status(200).json(people);
    } catch (error) {
        console.error('Erro ao buscar estudantes:', error);
        return res.status(500).send('Erro ao buscar estudantes');
    }
};

// DROPDOWN FUNCIONÁRIOS
export const getDropdownEmployee = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const employees = await Person.findAll({
            where: { employee: true },
            attributes: ['id', 'name'], // Apenas 'id' e 'name' do funcionário
        });

        if (employees.length === 0) {
            return res.status(404).json({ message: 'Nenhum funcionário encontrado' });
        }

        return res.status(200).json(employees);
    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar funcionários',
        });
    }
};

// DROPDOWN ESTUDANTES
export const getDropdownStudent = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const students = await Person.findAll({
            where: { employee: false },
            attributes: ['id', 'name'], // Apenas 'id' e 'name' do estudante
        });

        if (students.length === 0) {
            return res.status(404).json({ message: 'Nenhum estudante encontrado' });
        }

        return res.status(200).json(students);
    } catch (error) {
        console.error('Erro ao buscar estudantes:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar estudantes',
        });
    }
};

// UPDATE
export const updatePerson = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const {
            name,
            identity,
            email,
            phone,
            birthday,
            height,
            weight,
            password,
            employee_level,
            zipCode,
            state,
            city,
            address,
            country,
            active
        } = req.body;

        const person = await Person.findByPk(id);
        if (!person) {
            return res.status(404).json({ success: false, error: 'Pessoa não encontrada' });
        }

        // Validação dos dados de atualização
        const validationError = validatePersonData(req.body);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        const document = identity.replace(/[.\-\/]/g, '');

        // Atualização dos campos da pessoa
        person.name = name;
        person.identity = document;
        person.email = email;
        person.phone = phone;
        person.birthday = birthday;
        person.active = active;
        person.address = address;
        person.zipCode = zipCode;
        person.city = city;
        person.state = state;
        person.country = country;
        person.height = height;
        person.weight = weight;
        person.password = password;
        person.employee_level = employee_level;

        // Salva as mudanças
        await person.save();

        return res.status(200).json({
            success: true,
            message: 'Pessoa atualizada com sucesso',
            data: {
                id: person.id,
                name: person.name,
                email: person.email,
                phone: person.phone,
                birthday: person.birthday,
                address: person.address,
                zipCode: person.zipCode,
                city: person.city,
                state: person.state,
                country: person.country,
                height: person.height,
                weight: person.weight,
                active: person.active,
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        return res.status(500).json({ success: false, error: 'Erro ao atualizar pessoa' });
    }
};

// Deletar (anonimizar) pessoa (professor ou aluno)
export const deletePerson = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        // Verifica se a pessoa existe
        const person = await Person.findByPk(id);
        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Pessoa não encontrada'
            });
        }

        // Anonimização dos dados sensíveis
        person.name = 'Anônimo';
        person.email = `anonimo+${person.id}@domain.com`; // Gera um email anonimo com o id do usuário
        person.identity = 'REMOVIDO'; // Ou você pode definir como '000000000'
        person.phone = undefined; // Usa undefined para apagar o telefone
        person.address = undefined; // Usa undefined para apagar o endereço
        person.zipCode = undefined; // Usa undefined para apagar o CEP
        person.city = undefined; // Usa undefined para apagar a cidade
        person.state = undefined; // Usa undefined para apagar o estado
        person.country = undefined; // Usa undefined para apagar o país
        person.height = undefined; // Remove dados não necessários
        person.weight = undefined; // Remove dados não necessários
        person.active = 0; // Marca a pessoa como inativa

        // Salva as alterações
        await person.save();

        return res.status(200).json({
            success: true,
            message: `Pessoa anonimizada com sucesso (ID: ${person.id})`
        });
    } catch (error) {
        console.error('Erro ao anonimizar pessoa:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao anonimizar pessoa'
        });
    }
};

export const validatePersonData = (personData: any) => {
    const {
        name,
            identity,
            email,
            phone,
            birthday,
            height,
            weight,
            password,
            employee,
            employee_level,
            zipCode,
            state,
            city,
            address,
            country,
            active
    } = personData;

    if (!name || name.trim() === '') return 'O campo name é obrigatório';
    if (!identity || identity.trim() === '') return 'O campo identity é obrigatório';
    if (!email || email.trim() === '') return 'O campo email é obrigatório';
    if (!phone || phone.trim() === '') return 'O campo phone é obrigatório';
    if (!birthday) return 'O campo birthday é obrigatório';
    if (active === undefined) return 'O campo active é obrigatório';
    if (!address || address.trim() === '') return 'O campo address é obrigatório';
    if (!zipCode || zipCode.trim() === '') return 'O campo zipCode é obrigatório';
    if (!city || city.trim() === '') return 'O campo city é obrigatório';
    if (!state || state.trim() === '') return 'O campo state é obrigatório';
    if (!country || country.trim() === '') return 'O campo country é obrigatório';
    if (!height) return 'O campo height é obrigatório';
    if (!weight) return 'O campo weight é obrigatório';
    if (!password || password.trim() === '') return 'O campo password é obrigatório';
    if (employee === undefined) return 'O campo employee é obrigatório';
    if (!employee_level || employee_level.trim() === '') return 'O campo employee_level é obrigatório';

    return null; // Se todos os campos estiverem corretos, retorna null (sem erros)
};
