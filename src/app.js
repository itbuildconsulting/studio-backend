const express = require('express');
const app = express();
const router = express.Router();
app.use(express.json());
//Rotas
const bankRoute = require('./routes/bankRoute');
const classRoute = require('./routes/classRoute');
const index = require('./routes/index');
const loginRoute = require('./routes/loginRoute');
const personRoute = require('./routes/personRoute');
const placeRoute = require('./routes/placeRoute');
const productRoute = require('./routes/productRoute');
const productTypeRoute = require('./routes/productTypeRoute');
const seedRoute = require('./routes/seedRoute');

app.use('/bank', bankRoute);
app.use('/class', classRoute);
app.use('/', index);
app.use('/login', loginRoute);
app.use('/persons', personRoute);
app.use('/places', placeRoute);
app.use('/products', productRoute);
app.use('/productTypes', productTypeRoute);
app.use('/seed', seedRoute);

module.exports = app;