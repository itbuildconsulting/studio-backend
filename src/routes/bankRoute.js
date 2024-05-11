const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController')

router.post('/', bankController.create);
router.get('/', bankController.getAll);
router.get('/:id', bankController.getById);
router.put('/:id', bankController.update);
router.delete('/:id', bankController.delete);
module.exports = router;