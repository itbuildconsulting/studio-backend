const express = require('express');
const swaggerSetup = require('./swagger.js');
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
const paymentRoute = require('./routes/paymentRoute');
const checkoutRoute = require('./routes/checkoutRoute');

app.use('/bank', bankRoute);
app.use('/class', classRoute);
app.use('/', index);
app.use('/login', loginRoute);
app.use('/persons', personRoute);
app.use('/places', placeRoute);
app.use('/products', productRoute);
app.use('/productTypes', productTypeRoute);
app.use('/seed', seedRoute);
app.use('/payments', paymentRoute);
app.use('/checkout', checkoutRoute);

swaggerSetup(app);

module.exports = app;