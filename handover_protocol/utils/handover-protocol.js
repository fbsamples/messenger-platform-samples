/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';
const api = require('./api');

function passThreadControl (userPsid, targetAppId, metadata) {
  let payload = {
    recipient: {
      id: userPsid
    },
    target_app_id: targetAppId
  };
  if (metadata) {
    payload['metadata'] = metadata;
  }

  api.call('/pass_thread_control', payload, () => {});
}

function takeThreadControl (userPsid, metadata) {
  let payload = {
    recipient: {
      id: userPsid
    }
  };
  if (metadata) {
    payload['metadata'] = metadata;
  }

  api.call('/take_thread_control', payload, () => {});
}

module.exports = {
  passThreadControl,
  takeThreadControl
};
