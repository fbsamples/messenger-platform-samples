/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

// import dependencies
const bodyParser = require('body-parser'),
      express = require('express'),
      app = express();

// import helper libs
const sendQuickReply = require('./utils/quick-reply'),
      HandoverProtocol = require('./utils/handover-protocol'),
      env = require('./env');

// webhook setup
app.listen(process.env.PORT || env.PORT || 1337, () => console.log('webhook is listening'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// webhook verification
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
});

// webhook
app.post('/webhook', (req, res) => {

  // parse messaging array
  const webhook_events = req.body.entry[0];

  // initialize quick reply properties
  let text, title, payload;

  // Secondary Receiver is in control - listen on standby channel
  if (webhook_events.standby) {
    
    // iterate webhook events from standby channel
    webhook_events.standby.forEach(event => {
    
      const psid = event.sender.id;
      const message = event.message;

      if (message && message.quick_reply && message.quick_reply.payload == 'take_from_inbox') {
        // quick reply to take from Page inbox was clicked          
        text = 'The Primary Receiver is taking control back. \n\n Tap "Pass to Inbox" to pass thread control to the Page Inbox.';
        title = 'Pass to Inbox';
        payload = 'pass_to_inbox';
        
        sendQuickReply(psid, text, title, payload);
        HandoverProtocol.takeThreadControl(psid);
      }

    });   
  }

  // Bot is in control - listen for messages 
  if (webhook_events.messaging) {
    
    // iterate webhook events
    webhook_events.messaging.forEach(event => {      
      // parse sender PSID and message
      const psid = event.sender.id;
      const message = event.message;

      if (message && message.quick_reply && message.quick_reply.payload == 'pass_to_inbox') {
        
        // quick reply to pass to Page inbox was clicked
        let page_inbox_app_id = 263902037430900;          
        text = 'The Primary Receiver is passing control to the Page Inbox. \n\n Tap "Take From Inbox" to have the Primary Receiver take control back.';
        title = 'Take From Inbox';
        payload = 'take_from_inbox';
        
        sendQuickReply(psid, text, title, payload);
        HandoverProtocol.passThreadControl(psid, page_inbox_app_id);
        
      } else if (event.pass_thread_control) {
        
        // thread control was passed back to bot manually in Page inbox
        text = 'You passed control back to the Primary Receiver by marking "Done" in the Page Inbox. \n\n Tap "Pass to Inbox" to pass control to the Page Inbox.';
        title = 'Pass to Inbox';
        payload = 'pass_to_inbox';
        
        sendQuickReply(psid, text, title, payload);

      } else if (message && !message.is_echo) {      
        
        // default
        text = 'Welcome! The bot is currently in control. \n\n Tap "Pass to Inbox" to pass control to the Page Inbox.';
        title = 'Pass to Inbox';
        payload = 'pass_to_inbox';

        sendQuickReply(psid, text, title, payload);
      }
      
    });
  }

  // respond to all webhook events with 200 OK
  res.sendStatus(200);
});
