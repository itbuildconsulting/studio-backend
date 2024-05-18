const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Documentação da API',
    },
  },
  apis: [
    path.join(__dirname, './routes/*.js')
  ],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));
};
