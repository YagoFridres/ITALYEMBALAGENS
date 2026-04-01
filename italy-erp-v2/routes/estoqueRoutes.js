const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { list, getOne, create, update, remove, movimento } = require('../controllers/estoqueController');

const router = express.Router();

router.get('/', requireAuth, list);
router.post('/', requireAuth, create);
router.get('/:id', requireAuth, getOne);
router.put('/:id', requireAuth, update);
router.delete('/:id', requireAuth, remove);
router.post('/:id/movimento', requireAuth, movimento);

module.exports = router;
