const xbank = require('../models/bank.model.js')
const xclass = require('../models/class.model.js')
const xperson = require('../models/person.model.js')
const xplace = require('../models/place.model.js')
const xproduct = require('../models/product.model.js')
const xproductType = require('../models/productType.model.js')

// Define as funções do controlador
const seedController = {
    async post(req, res, next) {
        try {
            await xplace.sync();
            await xproductType.sync();
            await xperson.sync();
            await xproduct.sync();
            await xclass.sync();
            await xbank.sync();

            res.status(201).send('All models synchronized with database');
        } catch (err) {
            res.status(400).send('Error syncing models with database: ' + err);
        }
    },
    async addFirstData(req, res, next) {
        try {
            await xperson.create({ "name":"admin", "identity": "000000000", "email":"admin@example.com", "phone": "00000000", "birthday": "1994-05-17", "height": "160", "weight": "100", "other": "41", "password":"testing", "rule": "", "frequency": "", "active":"true", "employee":"true", "employee_level": "admin" });
            res.status(201).send('All models synchronized with database');
        } catch (err) {
            res.status(400).send(err);
        }
    },
};

module.exports = seedController;
           
