// routes/formRoutes.js

const express = require('express');
const multer = require('multer'); 
const { submitForm, getFormById, getFormSubmissions, getAllForms, getFile, editForm, deleteForm, createPaymentIntent } = require('../controllers/formController'); 
const formController = require('../controllers/formController');
const { createCheckoutSession, handleStripeWebhook } = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



router.post('/submit',authenticate, upload.any(), submitForm);



router.get('/:id',authenticate, formController.getFormById);


router.put('/:id', editForm);



router.get('/',authenticate, getAllForms);



router.get('/file/:fileId', getFile);

router.delete('/:id', deleteForm);


router.post('/create-payment-intent', createPaymentIntent);

router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/create-checkout-session', createCheckoutSession);


module.exports = router;
