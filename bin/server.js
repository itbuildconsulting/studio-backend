const cors = require('cors');
const app = require('../src/app');
const port = normalizaPort(process.env.PORT || '3001');
function normalizaPort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
if (port >= 0) {
        return port;
    }
return false;
}

// Configurando o CORS
app.use(cors());

app.listen(port, function () {
    console.log(`app listening on port ${port}`)
})