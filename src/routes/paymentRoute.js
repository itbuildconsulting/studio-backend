const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController')



router.post('/', paymentController.createTransaction);

module.exports = router;