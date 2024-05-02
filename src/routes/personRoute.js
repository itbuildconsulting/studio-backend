const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController')

router.post('/', personController.create);
router.get('/', personController.getAll);
router.get('/:id', personController.getById);
router.put('/:id', personController.update);
router.delete('/:id', personController.delete);
module.exports = router;