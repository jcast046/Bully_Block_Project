const express = require('express');
const { getBullyReports, addBullyReport } = require('../controllers/bullyController');

const router = express.Router();

router.get('/', getBullyReports);
router.post('/', addBullyReport);

module.exports = router;
