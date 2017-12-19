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

// import utils
const QuickReply = require('./utils/quick-reply'),
      HandoverProtocol = require('./utils/handover-protocol'),
      env = require('./env');

// webhook setup
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
});

// webhook
app.post('/webhook', (req, res) => {

  // parse messaging array
  const webhook_events = req.body.entry[0].messaging;
  
  // iterate webhook events
  webhook_events.forEach(webhook_event => {
  
    // parse sender PSID and quick_reply
    const psid = webhook_event.sender.id;
    const quick_reply = webhook_event.message.quick_reply;
  

    if (quick_reply && quick_reply.payload === 'pass_thread_control') {      
      
      // quick reply to pass to Page inbox was clicked
      let page_inbox_app_id = 263902037430900;
      HandoverProtocol.passThreadControl(psid, page_inbox_app_id);
      QuickReply.handoverToBot();      

    } else if (quick_reply && quick_reply.payload === 'take_thread_control') {
      
      // quick reply to take from Page inbox was clicked
      HandoverProtocol.takeThreadControl(psid);
      take_from_inbox();  

    } else if (webhook_event.pass_thread_control) {
      
      // thread control was passed back to bot manually in Page inbox
      QuickReply.handoverToInbox();

    } else {      
      
      // default
      QuickReply.handoverToInbox();
    }
    
  });

  res.sendStatus(200);
});

