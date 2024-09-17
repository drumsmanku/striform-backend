const mongoose = require('mongoose');
const multer = require('multer');
const AWS = require('aws-sdk');
const Form = require('../models/Form');
const s3 = require('../utils/s3Config'); // Import S3 configuration
const stripe = require('../utils/stripeConfig');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Submit form data
exports.submitForm = async (req, res) => {
  try {
    const { formName, pages } = req.body;
    const files = req.files;
    const userId = req.userId;  // Assuming this comes from auth middleware
    // Validation for required fields
    if (!formName || !pages || !Array.isArray(JSON.parse(pages))) {
      return res.status(400).json({ error: 'Invalid form data' });
    }

    const fileData = {};

    // Check and process signature
    if (req.body.signature) {
      const base64Data = req.body.signature.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Upload signature to S3
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `signatures/${Date.now()}_signature.png`,
        Body: buffer,
        ContentType: 'image/png',
      };

      const uploadResult = await s3.upload(uploadParams).promise();

      fileData['signature'] = {
        url: uploadResult.Location,
        key: uploadResult.Key,
        mimetype: 'image/png',
      };
    }

    // Process uploaded files using multer
    if (files && files.length > 0) {
      for (const file of files) {
        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `uploads/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          
        };

        const uploadResult = await s3.upload(uploadParams).promise();

        fileData[file.fieldname] = {
          url: uploadResult.Location,
          key: uploadResult.Key,
          mimetype: file.mimetype,
        };
      }
    }

    // Create new form using MongoDB's _id
    const newForm = new Form({
      formName,
      userId,  // Associate form with the current user
      pages: JSON.parse(pages),
      files: fileData,
    });

    const savedForm = await newForm.save();

    res.status(201).json({ message: 'Form submitted successfully', formId: savedForm._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Updated getFormById to include file URLs
exports.getFormById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;  // Get the userId from the authenticated request

    const form = await Form.findOne({ _id: id, userId });  // Fetch form by ID and userId
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Updated getAllForms to include file URLs
exports.getAllForms = async (req, res) => {
  try {
    const userId = req.userId;  // Extract userId from the authenticated request
    const forms = await Form.find({ userId });  // Fetch forms associated with this user
    res.json(forms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }

};

// Function to get a file directly from S3
exports.getFile = (req, res) => {
  const { fileKey } = req.params;

  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    };

    s3.getObject(params)
      .createReadStream()
      .on('error', (error) => {
        console.error(error);
        res.status(404).json({ error: 'File not found' });
      })
      .pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Updated editForm to handle file updates in S3
exports.editForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { formName, pages } = req.body;
    const files = req.files; // Contains the newly uploaded files

    // Find the form by ID
    let form = await Form.findById(id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Update formName if provided
    if (formName) {
      form.formName = formName;
    }

    // Update pages if provided
    if (pages) {
      try {
        form.pages = JSON.parse(pages); // Ensure pages is valid JSON
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format for pages' });
      }
    }

    // Process newly uploaded files (using multer)
    if (files && files.length > 0) {
      if (!form.files) {
        form.files = new Map(); // Initialize the files Map if it doesn't exist
      }

      // Use a `for...of` loop to properly handle async uploads
      for (const file of files) {
        const sanitizedFileName = file.originalname.replace(/\./g, '_'); // Replace dots with underscores

        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `uploads/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        // Upload file to S3
        const uploadResult = await s3.upload(uploadParams).promise();

        // Add or update the file entry in the Map
        form.files.set(sanitizedFileName, {
          url: uploadResult.Location,
          key: uploadResult.Key,
          mimetype: file.mimetype,
        });
      }
    }

    // Save the updated form
    const updatedForm = await form.save();

    return res.status(200).json({ message: 'Form updated successfully', form: updatedForm });
  } catch (error) {
    console.error("Error in updating form:", error);
    res.status(500).json({ error: 'Server error' });
  }
};



// Delete a form and its associated files
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params; // Use MongoDB's _id for querying

    const form = await Form.findById(id); // Find the form by MongoDB's _id
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Delete associated files from S3
    const deletePromises = [];
    for (const [fieldName, file] of Object.entries(form.files)) {
      if (!file.key) {
        console.error(`File key is missing for field: ${fieldName}`, file);
        continue; // Skip this file if the key is missing
      }

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file.key,
      };

      deletePromises.push(s3.deleteObject(params).promise());
    }

    // Wait for all files to be deleted from S3
    await Promise.all(deletePromises);

    // Delete the form from MongoDB
    await Form.findByIdAndDelete(id);

    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error in deleteForm:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, paymentMethodTypes } = req.body;

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: paymentMethodTypes || ['card'],
    });

    res.status(201).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error.message);
    res.status(500).json({ error: 'Unable to create payment intent' });
  }
};

exports.handleStripeWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      console.error('PaymentIntent failed:', failedPaymentIntent.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};


// GET /api/forms/:formId/stats/total-submissions
exports.getTotalSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;
    const userId = req.userId; // Assuming you have the userId from your authentication middleware

    // Count submissions made by the logged-in user
    const totalSubmissions = await Form.countDocuments({ userId });

    res.json({ totalSubmissions });
  } catch (error) {
    console.error('Error fetching total submissions:', error);
    res.status(500).json({ error: 'Failed to fetch total submissions' });
  }
};



// GET /api/forms/:formId/stats/average-time
exports.getAverageTimeToComplete = async (req, res) => {
  try {
    const userId = req.userId; // Get the userId from authentication middleware

    // Find all submissions made by the logged-in user
    const formSubmissions = await Form.find({ userId });

    // Calculate total time for all submissions
    const totalTimes = formSubmissions.reduce((acc, submission) => {
      const timeTaken = (submission.completedAt - submission.startedAt) / 1000; // Time in seconds
      return acc + timeTaken;
    }, 0);

    // Calculate average time
    const averageTime = formSubmissions.length > 0 ? totalTimes / formSubmissions.length : 0;

    res.json({ averageTime: `${averageTime.toFixed(2)} seconds` });
  } catch (error) {
    console.error('Error fetching average time to complete:', error);
    res.status(500).json({ error: 'Failed to fetch average time to complete' });
  }
};
