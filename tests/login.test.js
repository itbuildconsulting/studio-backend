// login.test.js
const unirest = require('unirest');
const { app } = require('../src/server.js') // Substitua 'your_app' pelo nome do seu arquivo de aplicativo

test('login request should return a valid response', async () => {
  expect.assertions(2); // Defina o número de expectativas que você deseja que o teste execute

  const response = await new Promise((resolve, reject) => {
    unirest.post('http://localhost:3001/login')
      .headers({ 'Content-Type': 'application/json' })
      .send({ email: 'joao@example.com', password: 'testing' })
      .end(resolve);
  });

  // Verifique se o status da resposta é 200 (OK)
  expect(response.status).toBe(200);

  // Verifique se o corpo da resposta contém um token de autenticação (ou outro dado relevante)
  expect(response.body.token).toBeTruthy(); // Verifique se o token existe no corpo da resposta
});
