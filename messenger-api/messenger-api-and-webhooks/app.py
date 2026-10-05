"""
Copyright (c) Meta Platforms, Inc. and affiliates.
All rights reserved.

This source code is licensed under the license found in the
LICENSE file in the root directory of this source tree.
"""

import hashlib
import hmac
import json
import os

import requests
from flask import Flask, request

app = Flask(__name__)
TOKEN = os.environ.get("VERIFY_TOKEN", "")
PAGE_ACCESS_TOKEN = os.environ.get("PAGE_ACCESS_TOKEN", "")
APP_SECRET = os.environ.get("APP_SECRET", "")


@app.route("/webhook", methods=["GET", "POST"])
def webhook():
    # Webhook verification
    if request.method == "GET":
        if request.args.get("hub.mode") == "subscribe" and request.args.get(
            "hub.challenge"
        ):
            if not request.args.get("hub.verify_token") == TOKEN:
                return "Verification token mismatch", 403
            print("WEBHOOK_VERIFIED")
            return request.args["hub.challenge"], 200
    elif request.method == "POST":
        # Validate payload
        signature_header = request.headers.get("X-Hub-Signature-256")
        if not signature_header:
            return "MISSING SIGNATURE HEADER", 403
        parts = signature_header.split("=", 1)
        if len(parts) != 2:
            return "MALFORMED SIGNATURE HEADER", 403
        signature = parts[1]
        payload = request.get_data()
        expected_signature = hmac.new(
            APP_SECRET.encode("utf-8"), payload, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_signature):
            print("Signature hash does not match")
            return "INVALID SIGNATURE HASH", 403

        body = json.loads(payload.decode("utf-8"))

        if "object" in body and body["object"] == "page":
            entries = body["entry"]
            # Iterate through each entry as multiple entries can sometimes be batched
            for entry in entries:
                # Fetch the 'changes' element field
                change_event = entry["changes"][0]
                # Verify it is a change in the 'feed' field
                if change_event["field"] != "feed":
                    continue
                # Fetch the 'post_id' in the 'value' element
                post_id = change_event["value"]["post_id"]
                comment_on_post(post_id)

            return "WEBHOOK EVENT HANDLED", 200
        return "INVALID WEBHOOK EVENT", 403


def comment_on_post(post_id: str) -> None:
    payload = {"message": "Lovely post!"}
    headers = {"content-type": "application/json"}
    url = "https://graph.facebook.com/{}/comments?access_token={}".format(
        post_id, PAGE_ACCESS_TOKEN
    )

    r = requests.post(url, json=payload, headers=headers)
    print(r.text)


if __name__ == "__main__":
    app.run(debug=False)
