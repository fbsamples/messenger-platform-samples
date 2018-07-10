/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Customer chat plugin Tutorial
 *
 * Use this project as the starting point for following the
 * Messenger Platform Customer chat plugin tutorial.
 *
 * TBC
 *
 */

'use strict';

// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    app = express().use(body_parser.json()); // creates express http server
// TODO: Add values here
const access_token = '';
const page_inbox_app_id = "";
const verify_token = "";

// Set the folder for service HTML files
app.use(express.static('public'));



// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

// receives webhook events from Messenger Platform
app.post('/webhook', (req, res) => {

    // parse messaging array
    const webhook_events = req.body.entry[0];

    // Secondary Receiver is in control - listen on standby channel
    if (webhook_events.standby) {

        // iterate webhook events from standby channel
        webhook_events.standby.forEach(event => {
            handleEvent(event.sender.id, event);
        });
    }

    // Bot is in control - listen for messages
    if (webhook_events.messaging) {

        // iterate webhook events
        webhook_events.messaging.forEach(event => {
            handleEvent(event.sender.id, event);
        });
    }

    // respond to all webhook events with 200 OK
    res.sendStatus(200);

});


// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

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

// Check event type and pass to the appropriate handler function
function handleEvent(sender_psid, webhook_event) {
    if (webhook_event.message) {
        handleMessage(webhook_event.sender.id, webhook_event.message);
    } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
    } else if (webhook_event.referral) {
        handleReferral(sender_psid, webhook_event.referral);
    } else if (webhook_event.pass_thread_control) {
        handlePassThreadControl(sender_psid, webhook_event.pass_thread_control);
    }
}

// Handle thread control passed event
function handlePassThreadControl(sender_psid, received_event) {
    let response;
    response = {
        "text": "An automated agent is now helping you with your inquiry."
    };
    callSendAPI(sender_psid, response);
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;
    if (received_message && received_message.text == 'Customer Support') {
        response = {
            "text": "A human support agent is now helping you with your inquiry."
        };
        callSendAPI(sender_psid, response);
        passThreadControl(sender_psid, page_inbox_app_id);
    } else if (received_message.text) {
        if ((received_message.tags) && (received_message.tags.source == 'customer_chat_plugin')) {
            response = {
                "text": `We hope you enjoyed our website, we see you would like help with:\n "${received_message.text}".`
            };
        } else {
            response = {
                "text": `We see you would like help with ${received_message.text}.`
            };
        }
        callSendAPI(sender_psid, response);
    }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    console.log(`PSID: ${sender_psid}, postback: ${received_postback.ref}`);
}

// Handles messaging_referral events
function handleReferral(sender_psid, received_referral) {
    console.log(`PSID: ${sender_psid}, referral: ${received_referral.ref}`);
}

// Pass thread control
function passThreadControl(sender_psid, target_app_id) {
    console.log('PASSING THREAD CONTROL');
    let request_body = {
        recipient: {
            id: sender_psid
        },
        target_app_id
    };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/me/pass_thread_control",
        "qs": { "access_token": access_token },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error(`Unable to send message:${err}`);
        }
    });
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
        "uri": "https://graph.facebook.com/me/messages",
        "qs": { "access_token": access_token },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error(`Unable to send message:${err}`);
        }
    });
}

