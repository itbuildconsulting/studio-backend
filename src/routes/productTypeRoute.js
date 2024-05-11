const express = require('express');
const router = express.Router();
const productTypeController = require('../controllers/productTypeController')

router.post('/', productTypeController.create);
router.get('/', productTypeController.getAll);
router.get('/:id', productTypeController.getById);
router.put('/:id', productTypeController.update);
router.delete('/:id', productTypeController.delete);
module.exports = router;