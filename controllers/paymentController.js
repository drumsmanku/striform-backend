const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User'); // Import the User model

// Controller to handle creating a Stripe Checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.userId; // Get the user's email and userId from the authenticated user

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Subscription',
            },
            unit_amount: 2400,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
      
      metadata: {
        userId: userId, // Include user ID in the metadata to identify the user later
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};


// Controller to handle Stripe webhook events
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // Handle the event based on its type
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Retrieve user ID from session metadata
      const userId = session.metadata.userId;

      // Find the user and update their role to "pro"
      const user = await User.findById(userId);
      if (user) {
        user.isPro = true; // Update the user's pro status
        await user.save();
      }
    }

    // Respond to Stripe with a 200 status
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(400).json({ error: 'Webhook handler failed' });
  }
};

exports.verifyPayment = async (req, res) => {
    try {
      const { sessionId } = req.body; // Get the session ID from the request
      const session = await stripe.checkout.sessions.retrieve(sessionId); // Retrieve session details
  
      if (session.payment_status === 'paid') {
        // Payment is successful, update the user to 'pro'
        const userId = req.user.userId; // Extract the user ID from the decoded token
        await User.findByIdAndUpdate(userId, { role: 'pro' }); // Update the user to pro
  
        return res.json({ message: 'User upgraded to pro successfully!' });
      } else {
        return res.status(400).json({ error: 'Payment not completed or failed.' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ error: 'Failed to verify payment.' });
    }
  };