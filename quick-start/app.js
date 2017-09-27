'use strict';

// Imports credentials from environment variables
const VERIFY_TOKEN = process.env.VERIFY_TOKEN,
      PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

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

        receiveMessage(webhook_event);        

      } else if (webhook_event.postback) {

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

function receiveMessage(webhook_event) {

  let sender_psid = webhook_event.sender.id,
      recipient_psid = webhook_event.recipient.id,
      event_timestamp = webhook_event.timestamp,
      message = webhook_event.message,
      message_id = message.mid,
      message_text = message.text,
      message_attachments = message.attachments,
      quick_reply = message.quick_reply;

  console.log("Received message for user %d and page %d at %d with message.", 
    sender_psid, recipient_psid, event_timestamp);

  if (message_text) {
    let message_data;
    if (quick_reply) {
      message_data = {
        text: "Yeah " + quick_reply.payload + " is the best."
      }
    } else {
      // If we receive a text message, check to see if it matches a keyword
      // and send back the example. Otherwise, just echo the text we received.
      message_data = {
        text: "You sent a text message!"
      }
    }
    callSendAPI(sender_psid, message_data);    
    
  } else if (message_attachments) {
    let message_data = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "This is my postback payload.",
            }],
          }]
        }
      }
    }
    callSendAPI(sender_psid, message_data);
  }
}

function callSendAPI(psid, message_data) {

  let message = {
    recipient: {
      id: psid
    },
    message: message_data
  }

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

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  let payload = webhook_event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", sender_psid, recipient_psid, payload, postback_timestamp);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  let message_data = {
    "text": "What's your favorite food?",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Tacos",
        "payload":"just one taco",
        "image_url":"http://example.com/img/red.png"
      },
      {
        "content_type":"text",
        "title":"More Tacos",
        "payload":"extra tacos"
      }
    ]
  }
  
  callSendAPI(sender_psid, message_data);    
}