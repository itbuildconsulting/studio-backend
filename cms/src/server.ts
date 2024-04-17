import express from 'express';
import routes from './routes';
// import { MongoClient, ServerApiVersion } from 'mongodb';
import mongoose, { ConnectOptions } from "mongoose";

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


const uri = process.env.SERVER_MONGOACCESS;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//     serverApi: {
//       version: ServerApiVersion.v1,
//       strict: true,
//       deprecationErrors: true,
//     }
//   });
//   async function run() {
//     try {
//       // Connect the client to the server	(optional starting in v4.7)
//       await client.connect().then(()=>console.log('connected'))
//       .catch(e=>console.log(e));
//       // Send a ping to confirm a successful connection
//       await client.db("admin").command({ ping: 1 });
//       console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//       // Ensures that the client will close when you finish/error
//       await client.close();
//     }
//   }
//   run().catch(console.dir);

mongoose.connect(String(uri), { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as ConnectOptions)
    .then(()=>console.log('connected'))
    .catch(e=>console.log(e));

    // Configuração do CORS
app.use(cors());



app.use((req: any, res, next)=>{
    req.io = io;
    next();
});

app.use(routes);


app.listen(3010)