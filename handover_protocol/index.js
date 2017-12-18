/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const env = require('./env'),
      bodyParser = require('body-parser'),
      express = require('express'),
      app = express();

const sendQuickReply = require('./utils/quick-reply'),
      handover_protocol = require('./utils/handover-protocol');

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
});

app.post('/webhook', (req, res) => {
  const webhook_events = req.body.entry[0].messaging;
  webhook_events.forEach(webhook_event => {
    console.log(webhook_event)
    const psid = webhook_event.sender.id;
    const quick_reply = webhook_event.message.quick_reply;

    if (quick_reply) {
      let message;
      switch (quick_reply.payload) {
        case 'pass_thread_control':
          let page_inbox_app_id = 263902037430900;
          handover_protocol.passThreadControl(psid, page_inbox_app_id);
          message = 'You are now in a conversation with the Page Inbox. Tap "Handover to Bot" to let your bot take back thread control, or click the "Done" checkbox in your inbox.';
          sendQuickReply(psid, message, payload);
          break;
        case 'take_thread_control':
          handover_protocol.takeThreadControl(psid);
          message = 'You are now in a conversation with a bot. Tap "Handover to Page Inbox" to pass thread control to the Page Inbox.';
          sendQuickReply(psid, message, payload);
      }
    } else if (webhook_event.app_roles) {

    } else {
      message = 'You are now in a conversation with a bot. Tap "Handover to Page Inbox" to pass thread control to the Page Inbox.';
          sendQuickReply(psid, message, payload);
    }
    
  });

  res.sendStatus(200);
});