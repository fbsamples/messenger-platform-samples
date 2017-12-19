/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';
const api = require('./api');

module.exports = {
  handoverToInbox,
  handoverToBot
}

function handoverToBot () {
  
  let message = 'You are now in a conversation with the Page Inbox. Tap "Handover to Bot" to let your bot take back thread control, or click the "Done" checkbox in your inbox.';
  let payload = 'take_from_inbox';
  sendQuickReply(psid, message, payload);
}

function handoverToInbox () {
  
  let message = 'You are now in a conversation with a bot. Tap "Handover to Page Inbox" to pass thread control to the Page Inbox.';
  let payload = 'pass_to_inbox';
  sendQuickReply(psid, message, payload);
}

function sendQuickReply(psid, message, postback_payload) {
  let payload = {};
  let title; 

  payload.recipient = {
    id: psid
  }

  if (postback_payload === 'pass_to_inbox') {
    title = 'Handover to Inbox';
  } else if (postback_payload === 'take_from_inbox') {
    title = 'Handover to Bot';
  }

  payload.message = {
    text: message,
    quick_replies: [{
        content_type: 'text',
        title: title,
        payload: postback_payload
    }]    
  }

  api.call('/messages', payload, () => {});
}

module.exports = sendQuickReply;
