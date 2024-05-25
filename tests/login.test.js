// login.test.js
const unirest = require('unirest');
const { app } = require('../src/server.js')

let token;

test('login request should return a valid response', async () => {
  expect.assertions(2); 
  const response = await new Promise((resolve, reject) => {
    unirest.post('http://localhost:3001/login')
      .headers({ 'Content-Type': 'application/json' })
      .send({ email: 'admin@example.com', password: 'testing' })
      .end(resolve);
  });
  expect(response.status).toBe(200);
  expect(response.body.token).toBeTruthy();

  token = response.body.token
});