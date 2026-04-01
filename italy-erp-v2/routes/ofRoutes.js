const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { list, getOne, create, update, cancel, remove, meta } = require('../controllers/ofController');

const router = express.Router();

router.get('/meta', requireAuth, meta);
router.get('/', requireAuth, list);
router.post('/', requireAuth, create);
router.get('/:id', requireAuth, getOne);
router.put('/:id', requireAuth, update);
router.post('/:id/cancel', requireAuth, cancel);
router.delete('/:id', requireAuth, remove);

module.exports = router;
