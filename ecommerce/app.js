'use strict';
const PAGE_ACCESS_TOKEN = "";
const SERVER_URL = "";
// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    app = express().use(body_parser.json()); // creates express http server
app.use(body_parser.urlencoded({extended: false}));

// Stripe details
const keyPublishable = "";
const keySecret = "";
const stripe = require("stripe")(keySecret);

app.set("view engine", "pug");

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

let paymentsEnabled;

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;
    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        body.entry.forEach(function (entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;

            request({
                "uri": `https://graph.facebook.com/v2.6/${sender_psid}`,
                "qs": {"access_token": PAGE_ACCESS_TOKEN, "fields": "is_payment_enabled"},
                "method": "GET"
            }, (err, res, body) => {
                if (!err) {
                    let paymentsDetails = JSON.parse(body);
                    paymentsEnabled = paymentsDetails.is_payment_enabled;
                    if (webhook_event.message) {
                        handleMessage(sender_psid, webhook_event.message);
                    }
                } else {
                    console.error("Unable to send message:" + err);
                }
            });
        });
        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});

app.get('/product/:sku/:amount/:currency/:name', (req, res) => {
    let referer = req.get('Referer');
    if (referer) {
        if (referer.indexOf('www.messenger.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
        } else if (referer.indexOf('www.facebook.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
        }
        res.render('product', {
            keyPublishable,
            amount: req.params.amount,
            name: req.params.name,
            SERVER_URL,
            currency: req.params.currency
        })
    }
});

app.post("/charge", (req, res) => {
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
    })
        .then(customer =>
            stripe.charges.create({
                amount: req.body.amount,
                description: req.body.description,
                currency: req.body.currency,
                customer: customer.id
            }))
        .then(charge => res.render("charge", {description: req.body.description, amount: req.body.amount}));
});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

    /** UPDATE YOUR VERIFY TOKEN **/
    const VERIFY_TOKEN = "";

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

function handleMessage(sender_psid, received_message) {
    if (received_message.text) {
        if (received_message.text === "daily deals") {
            displayProducts(sender_psid)
                .then(function (returnedResponse) {
                    callSendAPI(sender_psid, returnedResponse);
                })
                .catch(function (err) {
                    console.log(err);
                })
        }
    }
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };
    console.log(request_body);
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": PAGE_ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!' + JSON.stringify(res));
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

function displayProducts(sender_psid) {
    return new Promise(function (resolve, reject) {
        const fs = require('fs');
        let json = JSON.parse(fs.readFileSync('items.json', 'utf8'));
        let elements = [];
        let response;

        json.products.forEach((entry) => {
            // Enable/disable for testing
            // paymentsEnabled = false;
            let buttons = [];
            if (paymentsEnabled === true) {
                buttons = {
                    "type": "payment",
                    "title": "Buy now",
                    "payload": `fb_buy_button_${entry.sku}`,
                    "payment_summary": {
                        "currency": entry.currency,
                        "payment_type": "FIXED_AMOUNT",
                        "is_test_payment": "TRUE",
                        "merchant_name": "The TShirt store",
                        "requested_user_info": [
                            "shipping_address",
                            "contact_name",
                            "contact_phone",
                            "contact_email"
                        ],
                        "price_list": [
                            {
                                "label": entry.name,
                                "amount": entry.price
                            }
                        ]
                    }
                }
            } else {
                buttons = {
                    "title": "Buy now",
                    "type": "web_url",
                    "url": `${SERVER_URL}/product/${entry.sku}/${entry.price}/${entry.currency}/${entry.name}`,
                    "messenger_extensions": true,
                    "webview_height_ratio": "tall",
                    "fallback_url": `${SERVER_URL}/product/${entry.sku}/${entry.price}/${entry.currency}/${entry.name}`,
                };
            }
            elements.push(
                {
                    "title": `${entry.name}`,
                    "subtitle": `${entry.description}`,
                    "image_url": `${SERVER_URL}/images/${entry.image}`,
                    "buttons": [
                        buttons
                    ]
                }
            );
            response = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "list",
                        "top_element_style": "compact",
                        "elements": elements,
                        "buttons": [
                            {
                                "title": "View More",
                                "type": "postback",
                                "payload": "payload"
                            }
                        ]
                    }
                }
            };
            resolve(response);
        });
    });
}