const crypto = require('crypto');

// --- REPLACE with your actual secret key from .env ---
const PAYSTACK_SECRET_KEY = 'sk_test_b6fcd2fbc7dfb3712c2728e46356b5daca0d284d';

// 1. Define the webhook payload as a JavaScript object.
const payloadObject = {
    event: "charge.success",
    data: {
        id: 3029618147,
        domain: "test",
        status: "success",
        reference: "T636329692994323", // Remember to change this for new tests
        amount: 50000,
        message: null,
        gateway_response: "Successful",
        paid_at: "2023-10-26T10:03:19.000Z",
        created_at: "2023-10-26T10:02:54.000Z",
        channel: "card",
        currency: "NGN",
        ip_address: "197.210.65.200",
        metadata: "",
        log: null,
        fees: 2100,
        fees_split: null,
        authorization: {},
        customer: {
            id: 123456,
            first_name: "Test",
            last_name: "User",
            email: "test@example.com", // <-- Ensure this matches your test user
            customer_code: "CUS_123456789",
            phone: null,
            metadata: null,
            risk_action: "default",
        },
    },
};

// 2. Convert the object to a JSON string WITHOUT any extra whitespace.
// This is the exact string your server will receive.
const requestBody = JSON.stringify(payloadObject);

// 3. Generate the signature using this canonical string.
const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(Buffer.from(requestBody, 'utf-8'))
    .digest('hex');

// 4. Log both the body and the signature for easy copy-pasting.
console.log('--- Request Body (copy this into Postman) ---');
console.log(requestBody);
console.log('\n--- X-Paystack-Signature (copy this into Postman header) ---');
console.log(hash);