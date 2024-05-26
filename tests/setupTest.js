// setupTests.js

const { app } = require('../src/server.js');

beforeAll(async () => {
  // Iniciar o servidor antes de todos os testes
  await new Promise((resolve, reject) => {
    app.listen(3002, () => {
      console.log('Servidor iniciado na porta 3002 para testes');
      resolve();
    });
  });
});

afterAll(async () => {
  // Encerrar o servidor após todos os testes
  await new Promise((resolve, reject) => {
    app.close(() => {
      console.log('Servidor encerrado após os testes');
      resolve();
    });
  });
});