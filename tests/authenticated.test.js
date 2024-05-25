// login.test.js
const unirest = require('unirest');
const { app } = require('../src/server.js')

let token;

test('error if without token', async () => {
  expect.assertions(1); 
  const response = await new Promise((resolve, reject) => {
    unirest.get('http://localhost:3001/persons')
      .headers({'Content-Type': 'application/json'})
      .end(resolve);
  });
  expect(response.status).toBe(401);
});

test('error if without token', async () => {
  expect.assertions(1); 
  const response = await new Promise((resolve, reject) => {
    unirest.post('http://localhost:3001/persons')
      .headers({'Content-Type': 'application/json'})
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password123',
        active: true,
        employee: true
      })
      .end(resolve);
  });
  expect(response.status).toBe(401);
});

test('error if without token', async () => {
  expect.assertions(1); 
  const response = await new Promise((resolve, reject) => {
    unirest.put('http://localhost:3001/persons/1')
      .headers({'Content-Type': 'application/json'})
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password123',
        active: true,
        employee: true
      })
      .end(resolve);
  });
  expect(response.status).toBe(401);
});