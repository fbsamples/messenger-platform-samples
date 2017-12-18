'use strict';
const request = require('request');

function SendAPIRequest() {
  this.jsonBody = {};

  this.setRecipient = function(recipientId) {
    this.jsonBody.recipient = {
      id: recipientId
    };
  };

  this.setQuickReply = function (message) {
    this.jsonBody.message = {
      text: message,
      quick_replies: [{
          content_type: 'text',
          title: 'handover',
          payload: 'handover'
      }]    
    };
  };

  this.send = function() {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: 'POST',
      json: this.jsonBody
    }, function(error, response, body) {});
  };
}

module.exports = SendAPIRequest;
