/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';
const api = require('./api');

function passThreadControl (userPsid, targetAppId) {
  let payload = {
    recipient: {
      id: userPsid
    },
    target_app_id: targetAppId
  };

  api.call('/pass_thread_control', payload, () => {});
}

function takeThreadControl (userPsid) {
  let payload = {
    recipient: {
      id: userPsid
    }
  };

  api.call('/take_thread_control', payload, () => {});
}

module.exports = {
  passThreadControl,
  takeThreadControl
};
