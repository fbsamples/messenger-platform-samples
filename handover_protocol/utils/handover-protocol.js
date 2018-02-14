/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

//import API helper
const api = require('./api');

function passThreadControl (userPsid, targetAppId) {
  console.log('PASSING THREAD CONTROL')
  let payload = {
    recipient: {
      id: userPsid
    },
    target_app_id: targetAppId
  };

  api.call('/pass_thread_control', payload, () => {});
}

function takeThreadControl (userPsid) {
  console.log('TAKING THREAD CONTROL')
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