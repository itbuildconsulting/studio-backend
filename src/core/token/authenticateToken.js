const jwt = require('jsonwebtoken');

// Middleware para validar o token em todas as rotas protegidas
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autorização não fornecido' });
  }

  jwt.verify(token, '6a78e7df-0a0d-4a3f-897f-de1ae0f5b9c3', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Falha ao autenticar o token' });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = authenticateToken;
