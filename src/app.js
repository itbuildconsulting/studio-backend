const express = require('express');
const app = express();
const router = express.Router();
//Rotas
const index = require('./routes/index');
const personRoute = require('./routes/personRoute');
const seedRoute = require('./routes/seedRoute');
app.use('/', index);
app.use('/persons', personRoute);
app.use('/seed', seedRoute);
module.exports = app;