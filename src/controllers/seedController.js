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
            await xproductType.sync();
            await xplace.sync();
            await xperson.sync();
            await xproduct.sync();
            await xclass.sync();
            await xbank.sync();

            res.status(201).send('All models synchronized with database');
        } catch (err) {
            res.status(400).send('Error syncing models with database: ' + err);
        }
    },
    async get(req, res, next) {
        try {
            await xproductType.sync();
            await xplace.sync();
            await xperson.sync();
            await xproduct.sync();
            await xclass.sync();
            await xbank.sync();
            
            res.status(201).send('All models synchronized with database');
        } catch (err) {
            res.status(500).send('Error syncing models with database: ' + err);
        }
    },
};

module.exports = seedController;
           
