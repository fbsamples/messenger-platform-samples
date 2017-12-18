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
const handover = require('./utils/handover-protocol');

const PAGE_INBOX_APP_ID = 263902037430900;

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
app.use(bodyParser.urlencoded({extended: false}).json());

app.get('/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
});

app.post('/webhook', function (req, res) {
  const events = req.body.entry[0].messaging;
  events.forEach(function (event) {
    const psid = event.sender.id;
    const text = event.message.text;

    if (text == 'handover') {
      handover.passThreadControl(psid, PAGE_INBOX_APP_ID);
    } else {
      let message = 'You are now in a conversation with a bot. Say \'handover\' at any time to talk to a human';
      sendQuickReply(psid, message);     
    }
  });

  res.sendStatus(200);
});


