const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController')

router.post('/', loginController.login);
//router.get('/', loginController.getAll);
//router.get('/:id', loginController.getById);
//router.put('/:id', loginController.update);
//router.delete('/:id', loginController.delete);
module.exports = router;