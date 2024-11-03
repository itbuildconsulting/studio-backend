import express, { Application } from 'express';
import cors from 'cors'; // Importa o cors
import swaggerSetup from './swagger/swagger';
//import bankRoute from './routes/bankRoute';
import classRoute from './routes/classRoutes';
//import indexRoute from './routes/indexRoute';
import loginRoute from './routes/loginRoutes';
import personRoute from './routes/personRoutes';
import placeRoute from './routes/placeRoutes';
import productRoute from './routes/productRoutes';
import productTypeRoute from './routes/productTypeRoutes';
import seedRoute from './routes/seedRoutes';
//import paymentRoute from './routes/paymentRoute';
import checkoutRoute from './routes/checkoutRoutes';
import appRoute from './routes/appRoutes';
import financialRoutes from './routes/financialRoutes';

const app: Application = express();

// Configuração do CORS
const corsOptions = {
    origin: '*', // Permite todas as origens (isso pode ser restrito a domínios específicos)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
  };
  
  app.use(cors(corsOptions)); // Aplica o middleware de CORS


app.use(express.json());

// Rotas
//app.use('/bank', bankRoute);
app.use('/class', classRoute);
//app.use('/', indexRoute);
app.use('/login', loginRoute);
app.use('/persons', personRoute);
app.use('/places', placeRoute);
app.use('/products', productRoute);
app.use('/productTypes', productTypeRoute);
app.use('/seed', seedRoute);
//app.use('/payments', paymentRoute);
app.use('/checkout', checkoutRoute);
app.use('/app', appRoute);
app.use('/financial', financialRoutes);

// Configuração do Swagger
swaggerSetup(app);

export default app;