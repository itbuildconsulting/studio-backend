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
