const { password } = require('../config/database.js');
const Person = require('../models/person.model.js');
const bcrypt = require('bcrypt');
const generateAuthToken = require('../core/token/generateAuthToken.js');

//Login
exports.login = async (req, res) => {
    const {email, password} = req.body;

    try {

        const person = await Person.findOne({ where: { email } });

        if (!person) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }

        const passwordMatch = await bcrypt.compare(password, person.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = generateAuthToken(person);

        return res.status(200).json({ token, expiresIn: '1h', name: person.name });
    } catch (error) {
        console.error('Erro durante o login:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    }


exports.create = async (req, res, next) => {
    try {
        const { name, email, password, active } = req.body;
        const newPerson = await Person.create({ name, email, password, active });
        res.status(201).json(newPerson);
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        res.status(500).send('Erro ao criar pessoa');
    }
};

// READ
exports.getAll = async (req, res, next) => {
    try {
        const persons = await Person.findAll();
        res.status(200).json(persons);
    } catch (error) {
        console.error('Erro ao buscar pessoas:', error);
        res.status(500).send('Erro ao buscar pessoas');
    }
};

exports.getById = async (req, res, next) => {
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
exports.update = async (req, res, next) => {
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
};

// DELETE
exports.delete = async (req, res, next) => {
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
};