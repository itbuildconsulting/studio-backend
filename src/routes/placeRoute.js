const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController')

router.post('/', placeController.create);
router.get('/', placeController.getAll);
router.get('/:id', placeController.getById);
router.put('/:id', placeController.update);
router.delete('/:id', placeController.delete);
module.exports = router;