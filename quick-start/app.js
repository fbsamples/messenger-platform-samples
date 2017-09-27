'use strict';

// Imports page access token from environment variable
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Imports dependencies and set up http server
const   
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server
  
// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(entry => {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      if (webhook_event.message) {

        // Event is type messages
        receiveMessage(webhook_event);        

      } else if (webhook_event.postback) {

        // Event is type messaging_postbacks
        receivePostback(webhook_event);

      }
      
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Imports verify token from environment variable
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'],
      token = req.query['hub.verify_token'],
      challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});


// Processes messages webhook event
function receiveMessage(webhook_event) {

  let sender_psid = webhook_event.sender.id,
      recipient_psid = webhook_event.recipient.id,
      event_timestamp = webhook_event.timestamp,
      message_id = message.mid,
      message = webhook_event.message;
      
      
  console.log("Received message for user %d and page %d at %d with message.", 
    sender_psid, recipient_psid, event_timestamp);

  if (message.text) {
    
    // Message contains text
    let message_data;

    if (message.quick_reply) {
      
      // 'quick_reply' property exists, so process the event as a quick reply
      message_data = {
        text: "Yeah " + quick_reply.payload + " is the best."
      }

    } else {
      
      // Message is text only, so send back a text message
      message_data = {
        text: "You sent the message: " + message.text;
      }
    }

    // Send the response message
    callSendAPI(sender_psid, message_data);    
    
  } else if (message.attachments) {

    // Message contains an attachment
    // Define message data for a Generic Template message
    let message_data = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "The Messenger Platform",
            subtitle: "Build awesome Messenger apps!",
            image_url: "https://raw.githubusercontent.com/amuramoto/messenger-platform-samples/master/images/Messenger_Icon.png",
            buttons: [{
              type: "web_url",
              url: "https://www.messenger.com/",
              title: "Open Webview"
            }, {
              type: "postback",
              title: "Send Postback",
              payload: "postback payload.",
            }],
          }]
        }
      }
    }

    // Send the response message
    callSendAPI(sender_psid, message_data);
  }
}


function callSendAPI(psid, message_data) {

  // Common format for basic message sends
  // Recipient is the PSID we received in the webhook event
  let message = {
    recipient: {
      id: psid
    },
    message: message_data
  }

  // Call the Send API
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: message
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      let recipient_id = body.recipient_id,
          message_id = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        message_id, recipient_id);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}


function receivePostback(webhook_event) {
  let sender_psid = webhook_event.sender.id,
      recipient_psid = webhook_event.recipient.id,
      postback_timestamp = webhook_event.timestamp;

  // Gets the 'payload' param set in the postback 
  let payload = webhook_event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", sender_psid, recipient_psid, payload, postback_timestamp);

  // Defines a quick reply to respond with
  // 'title' is displayed on the quick reply button
  // 'payload' is returned in the postback
  let message_data = {
    "text": "What's your favorite food?",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Cookies",
        "payload":"one cookie",
        "image_url":"https://raw.githubusercontent.com/amuramoto/messenger-platform-samples/master/images/cookie.png"
      },
      {
        "content_type":"text",
        "title":"More Cookies!",
        "payload":"more cookies"
      }
    ]
  }
  
  // Send the response message 
  callSendAPI(sender_psid, message_data);    
}