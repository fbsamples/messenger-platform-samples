/* Copyright (c) Meta Platforms, Inc. and affiliates.
* All rights reserved.
*
* This source code is licensed under the license found in the
* LICENSE file in the root directory of this source tree.
*/

package org.example;

import java.io.IOException;

public class Main {
    public static void main(String[] args) throws IOException {

        String igAccessToken = "";
        String fbAccessToken = "";

        Long fbSenderId = ;
        Long igSenderID = ;

        MessageSender mSender = new MessageSender();

        mSender.messageProcessor(fbSenderId, fbAccessToken);
        mSender.messageProcessor(igSenderID, igAccessToken);
    }
}
