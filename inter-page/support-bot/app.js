/**
 * Copyright 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Support bot of the Messenger Platform Inter-bot Tutorial
 *
 * Use this project as the starting point for following the tutorial.
 *
 * https://blog.messengerdevelopers.com/transferring-customer-support-requests-between-facebook-pages-241e23c7000c
 *
 */

'use strict';

// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 5001, () => console.log('webhook is listening'));

// Accepts POST requests at the /webhook endpoint
app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        body.entry.forEach(entry => {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log(`Sender PSID: ${sender_psid}`);

            // If statements here
        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

    const verify_token = process.env.TOKEN;

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === verify_token) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// Handle incoming messages to bot
function handleMessage(sender_psid, received_message) {
    let response;

    if (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase()) {
        response = {
            "text": `You sent the message: "${received_message.text}".`
        };
    } else {
        response = {
            "text": `Sorry, I don't understand what you mean.`
        }
    }

    // Send the response message
    callSendAPI(sender_psid, response);
}

// Parses incoming messages for the text
function handleIncoming(sender_psid, received_postback) {
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": process.env.ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}