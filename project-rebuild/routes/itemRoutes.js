const express = require('express');
const itemController = require('../controllers/itemController');

const router = express.Router();

router.get('/', itemController.getAll);
router.get('/:id', itemController.getOne);
router.post('/', itemController.create);
router.put('/:id', itemController.update);
router.delete('/:id', itemController.remove);

module.exports = router;
