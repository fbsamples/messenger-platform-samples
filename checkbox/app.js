/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform checkbox plugin tutorial
 *
 * This is the completed code for the Messenger Platform checkbox plugin tutorial
 *
 * TBC
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars
 *
 */


// Imports dependencies and set up http server
import request from 'request'; // creates express http server
import express from 'express';
import body_parser from 'body-parser';

const PAGE_ACCESS_TOKEN = "";
const app = express().use(body_parser.json());
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

// Serve the thanks page and log results from form submission
app.post('/send', (req, res) => {
    console.log(req.body);
    res.sendFile(__dirname+'/public'+'/thanks.html');
});

// Parse the request body from the POST
app.post('/webhook', (req, res) => {

    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        body.entry.forEach(entry => {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];

            if (webhook_event.message) {
                let sender_psid = webhook_event.sender.id;
                console.log(`Sender ID: ${sender_psid}`);
                handleMessage(sender_psid, webhook_event.message, null);
            }

        });
        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Handle incoming messages
function handleMessage(sender_psid, received_message, user_ref) {
    let response;
    let recipient;

    if (sender_psid) {
        recipient = {
            "id": sender_psid
        };
        response = {
            "text": `You sent the message: "${received_message.text}".`
        }
    }

    // Send the response message
    callSendAPI(sender_psid, recipient, response);
}

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

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

// Call the send API to send messages
function callSendAPI(sender_psid, recipient, response) {
    // Construct the message body
    let request_body = {
        recipient,
        "message": response
    };
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": PAGE_ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!');
        } else {
            console.error(`Unable to send message:${err}`);
        }
    });
}