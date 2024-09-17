// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);
router.post('/verify-payment', authenticate, paymentController.verifyPayment); 

module.exports = router;
