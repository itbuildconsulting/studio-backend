// login.test.js
const unirest = require('unirest');
const { app } = require('../src/server.js')

beforeAll(async () => {
    // Iniciar o servidor antes de todos os testes
    await new Promise((resolve, reject) => {
      app.listen(3001, () => {
        console.log('Servidor iniciado na porta 3001 para testes');
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