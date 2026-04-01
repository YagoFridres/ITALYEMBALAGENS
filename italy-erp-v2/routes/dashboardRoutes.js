const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { summary } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/summary', requireAuth, summary);

module.exports = router;
