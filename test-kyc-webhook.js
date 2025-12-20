// test-kyc-webhook.js
const crypto = require('crypto');

// --- CONFIGURATION ---
const SECRET_KEY = 'sk_test_b6fcd2fbc7dfb3712c2728e46356b5daca0d284d'; // REPLACE WITH YOUR ACTUAL .ENV PAYSTACK KEY
const URL = 'http://localhost:4000/api/kyc/webhook/paystack'; // Adjust port if needed

// CHANGE THIS TO YOUR USER'S PROVIDER ID FROM THE DB
const CUSTOMER_CODE = 'CUS_j9msfnhgq2pd2bp';

// --- PAYLOAD GENERATOR ---
const successPayload = {
    event: 'customeridentification.success',
    data: {
        customer_code: CUSTOMER_CODE,
        customer_id: 123456,
        identification: {
            status: 'success',
            country: 'NG',
            type: 'bvn'
        }
    }
};

const failurePayload = {
    event: 'customeridentification.failed',
    data: {
        customer_code: CUSTOMER_CODE,
        customer_id: 123456,
        reason: 'Date of birth does not match BVN record',
        identification: {
            status: 'failed',
        }
    }
};

async function sendWebhook(payload) {
    const body = JSON.stringify(payload);
    const hash = crypto.createHmac('sha512', SECRET_KEY).update(body).digest('hex');

    console.log(`Sending ${payload.event}...`);

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-paystack-signature': hash
            },
            body: body
        });

        console.log(`Response: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(text);
    } catch (e) {
        console.error('Error:', e);
    }
}

// UNCOMMENT ONE TO TEST:
sendWebhook(successPayload);
// sendWebhook(failurePayload);