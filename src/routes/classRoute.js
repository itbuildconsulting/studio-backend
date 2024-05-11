const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController')

router.post('/', classController.create);
router.get('/', classController.getAll);
router.get('/:id', classController.getById);
router.put('/:id', classController.update);
router.delete('/:id', classController.delete);
module.exports = router;