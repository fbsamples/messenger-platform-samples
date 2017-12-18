/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
const request = require('request');

const call = (endPoint, messagePayload, callback) => {
  if (!endPoint) {
    console.error('No endpoint specified on Messenger send!');
    return;
  }

  let accessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  let graphUrl = process.env.GRAPH_URL;
  if (!accessToken || !graphUrl) {
    console.error('No Messenger page access token or graph url configured!');
    return;
  }

  const queryParams = {
    access_token: accessToken,
  };

  const method = messagePayload ? 'POST' : 'GET';

  console.log(
    'Sending some post data: ',
    JSON.stringify(messagePayload, null, 2)
  );

  request({
    uri: graphUrl + endPoint,
    qs: queryParams,
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
  call,
};
