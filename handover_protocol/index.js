/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const sendQuickReply = require('./utils/quick-reply');
const handover_protocol = require('./utils/handover-protocol');

const PAGE_INBOX_APP_ID = 263902037430900;

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
app.use(bodyParser.urlencoded({extended: false}).json());

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
});

app.post('/webhook', (req, res) => {
  const webhook_events = req.body.entry[0].messaging;
  webhook_events.forEach(webhook_event => {
    const psid = webhook_event.sender.id;
    const text = webhook_event.message.text;

    if (text == 'handover') {
      handover_protocol.passThreadControl(psid, PAGE_INBOX_APP_ID);
    } else {
      let message = 'You are now in a conversation with a bot. Say \'handover\' at any time to talk to a human';
      sendQuickReply(psid, message);     
    }
  });

  res.sendStatus(200);
});


