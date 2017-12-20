/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

//import API helper
const api = require('./api');

// Send a quick reply message
function sendQuickReply(psid, text, title, postback_payload) {
  
  console.log('SENDING QUICK REPLY');
  
  let payload = {};
  
  payload.recipient = {
    id: psid
  }

  payload.message = {
    text: text,
    quick_replies: [{
        content_type: 'text',
        title: title,
        payload: postback_payload
    }]    
  }

  api.call('/messages', payload, () => {});
}

module.exports = sendQuickReply;