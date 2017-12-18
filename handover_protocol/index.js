/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const bodyParser = require('body-parser');
const express = require('express');

const SendAPIRequest = require('./utils/send-api-request');
const handover = require('./utils/handover-protocol');

const PAGE_INBOX_APP_ID = 263902037430900;

const app = express();

app.set('port', (process.env.PORT || 1337));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
});

app.post('/webhook', function (req, res) {
  const events = req.body.entry[0].messaging;
  events.forEach(function (event) {
    const sender = event.sender.id;
    const text = event.message.text;

    if (text == 'handover') {
      handover.passThreadControl(
        sender,
        PAGE_INBOX_APP_ID
      );
    } else {
      var sendAPIRequest = new SendAPIRequest();
      sendAPIRequest.setRecipient(sender);
      sendAPIRequest.setQuickReply(
        'You are now in a conversation with a bot. Say \'handover\' at any time to talk to a human'
      );
      sendAPIRequest.send();     
    }
  });

  res.sendStatus(200);
});

app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
});
