import express from 'express';
import routes from 'routes';

const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config();



const app = express();
const server = require('https').Server(app);
const io = require('socket.io')(server);

// Aumentar o limite para o tamanho do corpo da requisição
app.use(express.json({ limit: '50mb' })); // Para requisições JSON
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Para requisições form-urlencoded
app.set('io', io);

// Configuração do CORS
app.use(cors());

app.use((req: any, res, next)=>{
    req.io = io;
    next();
});

app.use(routes);


app.listen(3010)