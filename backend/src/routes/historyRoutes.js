const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateDailyHistory,
  validateMonthlyHistory,
  validateRangeHistory
} = require('../middleware/validation');

// All historical reports require authentication
router.use(authenticateToken);

router.get('/daily', validateDailyHistory, historyController.getDailyHistory);
router.get('/monthly', validateMonthlyHistory, historyController.getMonthlyHistory);
router.get('/range', validateRangeHistory, historyController.getRangeHistory);

module.exports = router;
