const express = require('express');
const router = express.Router();
const layoffController = require('../controllers/layoffController');

router.get('/', layoffController.getLayoffs);
router.get('/sources', layoffController.getSources);
router.get('/sources/stats', layoffController.getSourceStats);
router.get('/by-source', layoffController.getLayoffsBySource);
router.post('/sync', layoffController.syncLayoffs);
router.post('/cleanup', layoffController.cleanupDuplicates);
router.post('/cleanup-large', layoffController.cleanupLargeEntries);

module.exports = router;
