const { password } = require('../core/db/database.js');
const Person = require('../models/person.model.js');
const bcrypt = require('bcryptjs');
const generateAuthToken = require('../core/token/generateAuthToken.js');
const crypto = require('crypto');
const { sendEmail } = require('../core/email/emailService.js');

module.exports.login = async (req, res) => {
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

};

module.exports.reset = async (req, res) => {
    const {email, key} = req.body;

    try {

        const person = await Person.findOne({ where: { email } });

        if (!person) {
            return res.status(201).send({ 'Senha enviada' });
        }

        person.password = generateRandomPassword(6);

        person.save();

        sendEmailNewPassword(person.email, person.password);

        return res.status(200).send('Senha enviada para email');
    } catch (error) {
        console.error('Erro durante o login:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }

};

function generateRandomPassword(length) {
    // Comprimento padrão da senha, caso não seja fornecido
    length = length || 6;
  
    // Definindo os caracteres possíveis para a senha
    const charset = '0123456789';
  
    let password = '';
    for (let i = 0; i < length; i++) {
      // Gerando um índice aleatório no charset
      const randomIndex = crypto.randomInt(0, charset.length);
      // Adicionando o caractere correspondente ao índice aleatório à senha
      password += charset[randomIndex];
    }
  
    return password;
  }
