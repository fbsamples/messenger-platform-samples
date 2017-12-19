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
const QuickReply = require('./utils/quick-reply'),
      HandoverProtocol = require('./utils/handover-protocol'),
      env = require('./env');

// webhook setup
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
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
  const webhook_events = req.body.entry[0].messaging;
console.log(req)    
  // iterate webhook events
  webhook_events.forEach(event => {
console.log(event)  
    // parse sender PSID and message
    const psid = event.sender.id;
    const message = event.message;
    
    if (message && message.quick_reply) {
      
      switch (message.quick_reply.payload) {
       
        case 'pass_thread_control':

          // quick reply to pass to Page inbox was clicked
          let page_inbox_app_id = 263902037430900;
          HandoverProtocol.passThreadControl(psid, page_inbox_app_id);
          QuickReply.handoverToBot(psid);      

        case 'take_thread_control':

          // quick reply to take from Page inbox was clicked
          HandoverProtocol.takeThreadControl(psid);
          take_from_inbox(psid);  

      }
      
    } else if (webhook_event.pass_thread_control) {
      
      // thread control was passed back to bot manually in Page inbox
      QuickReply.handoverToInbox(psid);

    } else {      
      
      // default
      QuickReply.handoverToInbox(psid);
    }
    
  });

  // respond to all webhook events with 200 OK
  res.sendStatus(200);
});