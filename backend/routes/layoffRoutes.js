const express = require('express');
const router = express.Router();
const layoffController = require('../controllers/layoffController');

router.get('/', layoffController.getLayoffs);
router.post('/sync', layoffController.syncLayoffs);
router.post('/cleanup', layoffController.cleanupDuplicates);
router.post('/cleanup-large', layoffController.cleanupLargeEntries);

module.exports = router;
