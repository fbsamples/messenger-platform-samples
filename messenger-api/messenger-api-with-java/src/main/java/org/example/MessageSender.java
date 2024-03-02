/* Copyright (c) Meta Platforms, Inc. and affiliates.
* All rights reserved.
*
* This source code is licensed under the license found in the
* LICENSE file in the root directory of this source tree.
*/

package org.example;

import okhttp3.*;

import java.io.IOException;

public class MessageSender {
    public void messageProcessor(Long recipientID, String accessToken) throws IOException {
        OkHttpClient client = new OkHttpClient().newBuilder()
                .build();

        //setting the request data type
        MediaType mediaType = MediaType.parse("application/json");

        //creating the request body
        RequestBody body = RequestBody.create(mediaType, "{\n  \"recipient\":{\n    \"id\":"+recipientID+ "\n  },\n  \"message\":{\n    \"text\":\"Hello. Yes we do have toy dolphins in stock. How many would you like?\"\n  }\n}");

       //building the request
        Request request = new Request.Builder()
                .url("https://graph.facebook.com/v15.0/me/messages?access_token="+accessToken)
                .method("POST", body)
                .addHeader("Content-Type", "application/json")
                .build();

        //executing the request
        Response response = client.newCall(request).execute();

        //if there is no issue, print the console message
        if(response.code() == 200){
            System.out.println("\n\t*************************************************************\n\n");
            System.out.println("\tMessage to sender of ID "+ recipientID +" sent successfully.");
            System.out.println("\n\n\t*************************************************************\n");
        }

    }
}
