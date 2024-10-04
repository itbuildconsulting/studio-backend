const { password } = require('../core/db/database.js');
const Person = require('../models/person.model.js');
const validateToken = require('../core/token/authenticateToken.js');
const { Op } = require('sequelize'); // Operadores do Sequelize

// CREATE
module.exports.create = async (req, res, next) => {
    try {
        validateToken(req, res, async () => {
            const { name, identity, email, phone, birthday, active, address, zipCode, city, state, country, height, weight, other, password, rule, frequency,  employee, employee_level } = req.body;
            try {
                const newPerson = await Person.create({ name, identity, email, phone, birthday, active, address, zipCode, city, state, country, height, weight, other, password, rule, frequency,  employee, employee_level });
                res.status(201).json(newPerson);
            } catch (createError) {
                console.error('Erro ao criar pessoa:', createError);
                res.status(500).json(
                    { 
                        success: false,
                        data:  createError,
                        error: 'Erro ao criar pessoa' }
                    );
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        res.status(401).send('Token inválido');
    }
};

// READ
module.exports.getAll = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Person.findAll().then((persons) => {
              res.status(200).json(persons);
            });
          });
    } catch (error) {
        console.error('Erro ao buscar pessoas:', error);
        res.status(500).json(
            { 
                success: false,
                data:  error,
                error: 'Erro ao buscar pessoas' }
            );
    }
};

module.exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const person = await Person.findByPk(id);
        if (!person) {
            return res.status(404).send('Pessoa não encontrada');
        }
        res.status(200).json(person);
    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        res.status(500).send('Erro ao buscar pessoa');
    }
};



module.exports.getByCriteriaEmployee = async (req, res, next) => {
    try {

        const { email, name, identity } = req.body;

        const criteria = { employee: true }; // Assegure-se que a coluna é 'employee', e não 'employer' se necessário
        console.log(name)
        if (email) criteria.email = email;
        if (name) criteria.name = { [Op.like]: `%${name}%` }; // Uso de 'like' para busca parcial corrigido
        if (identity) criteria.identity = identity;

        const people = await Person.findAll({
            where: criteria
        });

        if (!people || people.length === 0) {
            return res.status(404).send('Pessoas não encontradas');
        }

        res.status(200).json(people);
    } catch (error) {
        console.error('Erro ao buscar pessoas:', error);
        res.status(500).send('Erro ao buscar pessoas');
    }
};

module.exports.getByCriteriaStudent = async (req, res, next) => {
    try {
        //const { email, nome, cpf } = req.query; // Assume que os filtros podem vir como query parameters
        const email = req.params.email;
        const nome = req.params.nome;
        const cpf = req.params.cpf;

        const criteria = {employee: false};
        if (email) criteria.email = email;
        if (nome) criteria.name = { [Op.like]: `%${nome}%` }; // Uso de 'like' para busca parcial
        if (cpf) criteria.cpf = cpf;

        const person = await Person.findOne({
            where: criteria
        });

        if (!person) {
            return res.status(404).send('Pessoa não encontrada');
        }

        res.status(200).json(person);
    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        res.status(500).send('Erro ao buscar pessoa');
    }
};


module.exports.getDropdownEmployee = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Person.findAll({
                where: {
                    employee: true
                },
                attributes: ['id', 'name'], // Especifica que apenas 'id' e 'name' do funcionário são necessários
            }).then((employees) => {
                if (employees.length === 0) {
                    res.status(404).json({ message: 'No employees found' });
                } else {
                    res.status(200).json(employees);
                }
            });
        });
    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        res.status(500).json({
            success: false,
            data: error,
            error: 'Erro ao buscar funcionários'
        });
    }
};

module.exports.getDropdownStudent = async (req, res, next) => {
    try {
        validateToken(req, res, () => {
            Person.findAll({
                where: {
                    employee: false // Filtra apenas onde `employee` é false
                },
                attributes: ['id', 'name'] // Especifica que apenas 'id' e 'name' do estudante são necessários
            }).then((students) => {
                if (students.length === 0) {
                    res.status(404).json({ message: 'No students found' });
                } else {
                    res.status(200).json(students);
                }
            });
        });
    } catch (error) {
        console.error('Erro ao buscar estudantes:', error);
        res.status(500).json({
            success: false,
            data: error,
            error: 'Erro ao buscar estudantes'
        });
    }
};



// UPDATE
module.exports.update = async (req, res, next) => {
    try {
        validateToken(req, res, async () => {
            try {
                const id = req.params.id;
                const { name, email } = req.body;
                const person = await Person.findByPk(id);
                
                if (!person) {
                    return res.status(404).send('Pessoa não encontrada');
                }

                person.name = name;
                person.email = email;
                await person.save();

                res.status(200).json(person);
            } catch (error) {
                console.error('Erro ao atualizar pessoa:', error);
                res.status(500).send('Erro ao atualizar pessoa');
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        res.status(401).send('Token inválido');
    }
};

// DELETE
module.exports.delete = async (req, res, next) => {
    try {
        validateToken(req, res, async () => {
            try {
                const id = req.params.id;
                const person = await Person.findByPk(id);
                    if (!person) {
                        return res.status(404).send('Pessoa não encontrada');
                    }
                await person.destroy();
                res.status(200).send('Pessoa excluída com sucesso');
            } catch (error) {
                console.error('Erro ao excluir pessoa:', error);
                res.status(500).send('Erro ao excluir pessoa');
            }
        });
    } catch (error) {
        console.error('Erro ao validar token:', error);
        res.status(401).send('Token inválido');
    }
};