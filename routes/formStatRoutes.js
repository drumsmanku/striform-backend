const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/stats/total-submissions',authenticate,  formController.getTotalSubmissions);
router.get('/stats/average-time',authenticate,  formController.getAverageTimeToComplete);

module.exports = router;
