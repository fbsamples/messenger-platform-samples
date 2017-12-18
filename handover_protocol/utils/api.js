/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';
const request = require('request');

const call = (path, payload, callback) => {
  const accessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  const graphUrl = 'https://graph.facebook.com';

  if (!endPoint) {
    console.error('No endpoint specified on Messenger send!');
    return;
  }

  if (!accessToken || !graphUrl) {
    console.error('No Page access token or graph url configured!');
    return;
  }

  const method = messagePayload ? 'POST' : 'GET';

  console.log(
    'Sending some post data: ',
    JSON.stringify(messagePayload, null, 2)
  );

  request({
    uri: graphUrl + endPoint,
    qs: {'access_token': accessToken},
    method: method,
    json: messagePayload,
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log('Message sent succesfully: \n', JSON.stringify({
        endpoint: endPoint,
        message_data: messagePayload,
      }, null, 2));
      console.log('Received back the following body: \n', JSON.stringify(
        body, null, 2));
    } else {
      console.error(
        'Failure when calling Messenger API endpoint',
        response.statusCode,
        response.statusMessage,
        body.error
      );
    }
    callback(body);
  });
};

module.exports = {
  call
};
