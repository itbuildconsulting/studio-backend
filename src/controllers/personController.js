const { password } = require('../core/db/database.js');
const Person = require('../models/person.model.js');
const validateToken = require('../core/token/authenticateToken.js');

// CREATE
module.exports.create = async (req, res, next) => {
    try {
        validateToken(req, res, async () => {
            const { name, email, password, active, employee } = req.body;
            try {
                const newPerson = await Person.create({ name, email, password, active, employee });
                res.status(201).json(newPerson);
            } catch (createError) {
                console.error('Erro ao criar pessoa:', createError);
                res.status(500).send('Erro ao criar pessoa');
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
        res.status(500).send('Erro ao buscar pessoas');
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