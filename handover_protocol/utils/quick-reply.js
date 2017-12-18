'use strict';
const api = require('./api');

function sendQuickReply(psid, message) {
  let payload = {};

  payload.recipient = {
    id: psid
  }
  
  payload.message = {
    text: message,
    quick_replies: [{
        content_type: 'text',
        title: 'handover',
        payload: 'handover'
    }]    
  }

  api.call('/me/messages', payload, () => {});
}

module.exports = sendQuickReply;
