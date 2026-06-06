require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Standard Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html')); });
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
});
    
  


// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replaces escaped newlines standard in environment variable strings
        privateKey: process.env.FIREBASE_PRIVATE_KEY 
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
          : undefined,
      }),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
  }
}
const db = admin.firestore();

// Backend Source of Truth for Menu Items & Prices
const MENU_ITEMS = {
  1: { name: 'Avocado Quinoa Bowl', price: 12.99 },
  2: { name: 'Grilled Salmon & Asparagus', price: 16.49 },
  3: { name: 'Chickpea Buddha Bowl', price: 11.99 },
  4: { name: 'Honey Ginger Tofu Stir-Fry', price: 12.49 },
  5: { name: 'Mediterranean Chicken', price: 14.99 },
  6: { name: 'Zucchini Pesto Pasta', price: 10.99 },
  7: { name: 'Turkey Taco Salad', price: 13.49 },
  8: { name: 'Sweet Potato Lentil Curry', price: 11.99 },
  9: { name: 'Sesame Seared Ahi Tuna', price: 17.99 },
  10: { name: 'Chia Seed Berry Parfait', price: 8.49 }
};

/**
 * POST /api/checkout
 * Handles validation, Firestore persistence, notification email, and Stripe Session generation.
 */
app.post('/api/checkout', async (req, res) => {
  try {
    const { customer, items } = req.body;

    // Basic Request Validation
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing checkout data.' });
    }

    const { name, phone, address, instructions } = customer;
    if (!name || !phone || !address) {
      return res.status(400).json({ error: 'Name, phone, and delivery address are required.' });
    }

    // Backend Pricing Calculation & Validation
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbItem = MENU_ITEMS[item.id];
      if (!dbItem) {
        return res.status(400).json({ error: `Menu item with ID ${item.id} does not exist.` });
      }

      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity for item ID ${item.id}.` });
      }

      // Calculate matching costs using our secure backend pricing
      const itemCost = dbItem.price * quantity;
      subtotal += itemCost;

      validatedItems.push({
        id: item.id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: quantity
      });
    }

    // Apply the rules matching your UI calculations
    const shippingCharge = subtotal >= 50.00 ? 0.00 : 4.99;
    const taxCharge = parseFloat((subtotal * 0.0825).toFixed(2));
    const grandTotal = parseFloat((subtotal + shippingCharge + taxCharge).toFixed(2));

    // Save initial transaction state to Firebase Firestore
    const orderDocData = {
      customer: {
        name,
        phone,
        address,
        instructions: instructions || ''
      },
      items: validatedItems,
      subtotal,
      deliveryFee: shippingCharge,
      tax: taxCharge,
      grandTotal,
      status: 'pending_payment',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const orderRef = await db.collection('orders').add(orderDocData);

    // Prepare line items list for Stripe Checkout
    const stripeLineItems = validatedItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
      },
      quantity: item.quantity,
    }));

    // Add delivery charge as a line item if applicable
    if (shippingCharge > 0) {
      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Delivery Fee',
          },
          unit_amount: Math.round(shippingCharge * 100),
        },
        quantity: 1,
      });
    }

    // Add calculated sales tax as a line item
    if (taxCharge > 0) {
      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Estimated Sales Tax (8.25%)',
          },
          unit_amount: Math.round(taxCharge * 100),
        },
        quantity: 1,
      });
    }

    // Create a secure Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: stripeLineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
      metadata: {
        orderId: orderRef.id
      }
    });

    // Send Admin Notification Email via SendGrid
    const orderSummaryText = validatedItems
      .map(i => `- ${i.name} x${i.quantity} ($${(i.price * i.quantity).toFixed(2)})`)
      .join('\n');

    const emailPayload = {
      to: process.env.MERCHANT_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `New FreshBites Checkout Started: Order #${orderRef.id}`,
      text: `
        New Order Reference: ${orderRef.id}
        
        Customer Details:
        - Name: ${name}
        - Phone: ${phone}
        - Address: ${address}
        - Instructions: ${instructions || 'None'}
        
        Items Ordered:
        ${orderSummaryText}
        
        Subtotal: $${subtotal.toFixed(2)}
        Delivery Fee: $${shippingCharge.toFixed(2)}
        Tax (8.25%): $${taxCharge.toFixed(2)}
        Grand Total: $${grandTotal.toFixed(2)}
        
        Checkout Status: Pending Stripe Payment
      `,
      html: `
        <h3>New Order Reference: ${orderRef.id}</h3>
        <p><strong>Customer Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Address:</strong> ${address}</li>
          <li><strong>Instructions:</strong> ${instructions || 'None'}</li>
        </ul>
        <p><strong>Items Ordered:</strong></p>
        <ul>
          ${validatedItems.map(i => `<li>${i.name} x${i.quantity} ($${(i.price * i.quantity).toFixed(2)})</li>`).join('')}
        </ul>
        <p>
          Subtotal: $${subtotal.toFixed(2)}<br>
          Delivery Fee: $${shippingCharge.toFixed(2)}<br>
          Tax (8.25%): $${taxCharge.toFixed(2)}<br>
          <strong>Grand Total: $${grandTotal.toFixed(2)}</strong>
        </p>
        <p>Stripe Checkout Session Initiated: <a href="${session.url}">Session URL</a></p>
      `
    };

    // Await email delivery asynchronously so as not to block client response
    await sgMail.send(emailPayload).catch(err => {
      console.error('SendGrid email failure:', err.response ? err.response.body : err.message);
    });

    // Return the dynamic Stripe redirect URL to the frontend
    res.status(200).json({ url: session.url, orderId: orderRef.id });

  } catch (error) {
    console.error('Checkout error detail:', error);
    res.status(500).json({ error: 'Internal checkout processing error occurred.' });
  }
});

// Serve local static assets (if frontend HTML is in a directory named "public")
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FreshBites Server initialized. Listening on port ${PORT}`);
});
