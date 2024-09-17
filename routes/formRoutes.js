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

/**
 * @swagger
 * tags:
 *   name: Forms
 *   description: API endpoints for managing forms
 */

/**
 * @swagger
 * /forms/submit:
 *   post:
 *     summary: Submit a new form
 *     tags: [Forms]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: formName
 *         required: true
 *         description: Name of the form
 *         schema:
 *           type: string
 *           example: "User Registration Form"
 *       - in: formData
 *         name: pages
 *         required: true
 *         description: Array of pages with fields
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               pageId:
 *                 type: string
 *                 example: "page1"
 *               pageType:
 *                 type: string
 *                 example: "Contact Info"
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "firstName"
 *                     value:
 *                       type: string
 *                       example: "John"
 *       - in: formData
 *         name: files
 *         required: false
 *         description: Files to upload (e.g., signatures)
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *     responses:
 *       201:
 *         description: Form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Form submitted successfully"
 *       400:
 *         description: Invalid form data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid form data"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 */


router.post('/submit',authenticate, upload.any(), submitForm);

/**
 * @swagger
 * /forms/{formId}:
 *   get:
 *     summary: Retrieve a form by ID
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         description: ID of the form to retrieve
 *         schema:
 *           type: string
 *           example: "123456"
 *     responses:
 *       200:
 *         description: Form retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 formId:
 *                   type: string
 *                   example: "123456"
 *                 formName:
 *                   type: string
 *                   example: "User Registration Form"
 *                 pages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       pageId:
 *                         type: string
 *                         example: "page1"
 *                       pageType:
 *                         type: string
 *                         example: "Contact Info"
 *                       fields:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             key:
 *                               type: string
 *                               example: "firstName"
 *                             value:
 *                               type: string
 *                               example: "John"
 *       404:
 *         description: Form not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Form not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 */

router.get('/:id',authenticate, formController.getFormById);

/**
 * @swagger
 * /forms/edit/{formId}:
 *   put:
 *     summary: Edit an existing form
 *     tags: [Forms]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         description: ID of the form to edit
 *         schema:
 *           type: string
 *           example: "123456"
 *       - in: formData
 *         name: formName
 *         required: true
 *         description: Updated name of the form
 *         schema:
 *           type: string
 *           example: "User Registration Updated"
 *       - in: formData
 *         name: pages
 *         required: true
 *         description: Updated array of pages with fields
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               pageId:
 *                 type: string
 *                 example: "page1"
 *               pageType:
 *                 type: string
 *                 example: "Contact Info"
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "firstName"
 *                     value:
 *                       type: string
 *                       example: "John"
 *       - in: formData
 *         name: files
 *         required: false
 *         description: New files to upload
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *     responses:
 *       200:
 *         description: Form updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Form updated successfully"
 *       400:
 *         description: Invalid form data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid form data"
 *       404:
 *         description: Form not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Form not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 */
router.put('/:id', upload.any(),editForm);

/**
 * @swagger
 * /forms/:
 *   get:
 *     summary: Retrieve all forms
 *     tags: [Forms]
 *     responses:
 *       200:
 *         description: All forms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   formId:
 *                     type: string
 *                     example: "123456"
 *                   formName:
 *                     type: string
 *                     example: "User Registration Form"
 *                   pages:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         pageId:
 *                           type: string
 *                           example: "page1"
 *                         pageType:
 *                           type: string
 *                           example: "Contact Info"
 *                         fields:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               key:
 *                                 type: string
 *                                 example: "firstName"
 *                               value:
 *                                 type: string
 *                                 example: "John"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 */

router.get('/',authenticate, getAllForms);

/**
 * @swagger
 * /forms/file/{fileId}:
 *   get:
 *     summary: Retrieve a file by file ID
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         description: ID of the file to retrieve
 *         schema:
 *           type: string
 *           example: "file123"
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "File not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 */

router.get('/file/:fileId', getFile);

router.delete('/:id', deleteForm);


router.post('/create-payment-intent', createPaymentIntent);

router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/create-checkout-session', createCheckoutSession);


module.exports = router;
