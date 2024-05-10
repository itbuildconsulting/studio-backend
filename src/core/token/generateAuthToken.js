const jwt = require('jsonwebtoken');

const generateAuthToken = (person) => {
  const token = jwt.sign({ id: person.id, email: person.email }, '6a78e7df-0a0d-4a3f-897f-de1ae0f5b9c3', { expiresIn: '1h' });
  return token;
};

module.exports = generateAuthToken;