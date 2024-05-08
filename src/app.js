const express = require('express');
const app = express();
const router = express.Router();
app.use(express.json());
//Rotas
const index = require('./routes/index');
const personRoute = require('./routes/personRoute');
const seedRoute = require('./routes/seedRoute');
const loginRoute = require('./routes/loginRoute');
app.use('/', index);
app.use('/persons', personRoute);
app.use('/seed', seedRoute);
app.use('/login', loginRoute);
module.exports = app;