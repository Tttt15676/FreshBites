# FreshBites – Healthy Meal Delivery Platform

FreshBites is a responsive, full-stack food delivery landing page and checkout system designed to streamline order selection and payment processing. The application features a curated weekly menu, dynamic cart calculations, an interactive delivery information form, and an end-to-end checkout flow integrating Stripe, Firebase Firestore, and SendGrid.

## 1. Core Features

*   **Curated 10-Item Menu Grid**
    A responsive catalog featuring ten high-nutrition meals. Each card includes a pricing badge, a structured description, and an "Add to Order" action that populates the user's box.
*   **Dynamic Cart Calculations**
    Interactive order summary calculations executing in real time. Features include quantity adjustments, automatic subtotaling, tax computation (8.25%), and a tiered delivery fee structure (free shipping for orders totaling \$50.00 or more).
*   **Interactive Checkout Form**
    A client-side validated checkout section capturing critical delivery details (Full Name, Phone Number, Delivery Address, and Special Delivery Instructions) with synchronized element states.
*   **Persistent Light/Dark Mode Toggle**
    A fully integrated UI theme toggle transitions the site between a crisp, mint-accented light theme and a forest-green dark theme. Color states persist across sessions using browser localStorage.
*   **Secure Backend Price Validation**
    An Express-based check prevents client-side price tampering. The backend serves as the source of truth for all menu prices, recalculating taxes, delivery fees, and grand totals before processing transactions.
*   **Stripe Checkout Integration**
    Dynamic generation of secure Stripe Checkout Sessions, allowing customers to complete transactions using localized payment gateways.
*   **Data Persistence with Firebase Firestore**
    Initialization of checkout records under a pending_payment status in Firebase Firestore, capturing detailed customer and line-item objects.
*   **Merchant Email Notifications**
    Automatic transaction-initiation notifications sent to the merchant through SendGrid, featuring detailed text and HTML order summaries.

## 2. Tech Stack

### Frontend
*   **HTML5 & ES6+ JavaScript**: Native DOM manipulation, state management, and Fetch API communication.
*   **Tailwind CSS (v2.2)**: Responsive layouts, grids, flexboxes, and utility classes.
*   **Custom CSS**: Tailwind extensions providing light-to-dark transitions and a unique mint/forest-green color palette.

### Backend
*   **Node.js & Express.js**: Lightweight middleware layer managing API routes, JSON parsing, and static file serving.

### Database & Integrations
*   **Firebase Admin SDK**: Server-side communication with Firebase Firestore to log orders and track transactional history.
*   **Stripe API**: Secure billing engine processing payments via hosted checkout pages.
*   **SendGrid Mail API**: Multi-format email dispatcher handling customer checkout notices and merchant receipts.

## 3. Architecture Overview

This project employs a clean separation of concerns, decoupling client-side visual states from secure backend computations.

```text
├── public/
│   ├── index.html        # Responsive layout, menu grid, and checkout markup
│   ├── style.css         # Light/dark theme variables and UI transitions
│   └── script.js         # Cart logic, local theme persistence, and fetch requests
├── .env                  # Local environment variable configuration
├── package.json          # Dependency manifest and run scripts
└── server.js             # Express API, Firebase/Stripe handlers, and validation
```

1.  **Frontend Layer (`index.html`, `style.css`, `script.js`)**
    Responsible for local cart management, calculating preliminary costs to ensure a responsive UI, and collecting customer address data. To prevent discrepancies, it passes only menu IDs and quantities to the server.
2.  **Backend Layer (`server.js`)**
    Houses the definitive pricing configuration. It recalculates costs based on incoming IDs, formats items into Stripe-compliant cents (`unit_amount`), creates records in Firestore, and triggers notification hooks via SendGrid.
3.  **Third-Party Gateways**
    Offloads payment credential handling directly to Stripe, keeping your backend architecture out of PCI compliance scope.

## 4. Local Setup Instructions

Follow these steps to configure and run the FreshBites application locally.

### Prerequisites
*   Node.js (v18.0.0 or higher recommended)
*   A Stripe Account (Test Mode API keys)
*   A Firebase Project with Firestore enabled (Service Account JSON)
*   A SendGrid Account (Verified Sender Identity and API Key)

### Step 1: Install Dependencies
Clone your project repository, navigate to the root directory, and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory of the project. Use the template below to populate your service credentials:

```ini
# Server Configuration
PORT=3000
CLIENT_URL=http://localhost:3000

# Stripe Credentials (Test Mode)
STRIPE_SECRET_KEY=sk_test_...

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@://gserviceaccount.com
# Note: Ensure the private key uses literal \n characters or is formatted correctly
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----\n"

# SendGrid Configuration
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=sender@yourdomain.com
MERCHANT_EMAIL=orders@yourdomain.com
```

### Step 3: Align Frontend API Endpoints
The backend server defaults to running on port 3000 (or PORT defined in your `.env`).

*   **Note on local ports**: In `script.js`, ensure you adjust your local client fetch endpoint URL to match your backend port (change `http://localhost:5000/api/checkout` to `http://localhost:3000/api/checkout`) for seamless local communication.

### Step 4: Run the Application
To run the server in standard mode:
```bash
npm start
```

To run the server with hot-reloading for development:
```bash
npm run dev
```

The console will output:  
`FreshBites Server initialized. Listening on port 3000.`

You can access the static frontend application directly by opening `http://localhost:3000` in your web browser.

## 5. Client Showcase Note

This application is designed as a functional proof-of-concept for client portfolios and system reviews.

*   **Safe Stripe Test Mode**
    The payment integration utilizes Stripe Test Mode credentials. Reviewers can safely complete transactions using Stripe's test card numbers (e.g., entering `4242 4242 4242 4242` with any future expiration date and any three-digit CVV). No real financial transactions are processed.
*   **Simulated Sandbox Environment**
    Orders created during the checkout process write securely to a sandbox instance of Firebase Firestore and trigger sandboxed SendGrid notifications. This architecture demonstrates payment and database workflows in a safe, cost-free environment.
