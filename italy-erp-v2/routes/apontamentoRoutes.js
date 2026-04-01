const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { list, ativos, start, finish } = require('../controllers/apontamentoController');

const router = express.Router();

router.get('/', requireAuth, list);
router.get('/ativos', requireAuth, ativos);
router.post('/start', requireAuth, start);
router.post('/:id/finish', requireAuth, finish);

module.exports = router;
