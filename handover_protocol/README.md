# Handover Protocol Example Bot

This app is a basic demo of using the Messenger Platform's handover protocol.

## Requirements

To run this app you will need the following:

- Facebook developer account
- Facebook developer app with a configured webhook
- Facebook Page
- A server that has Node.js installed

## Setting Up the Webhook

This repo contains code for the webhook and application logic for an example Messenger bot. To run it, do the following:

1. Download this repo
2. Deploy the repo to your server
3. Create an `env` file with the following `module.exports` object:
``` js
module.exports = {
  "PAGE_ACCESS_TOKEN": "<YOUR PAGE ACCESS TOKEN>",  
  "VERIFY TOKEN": "YOUR WEBHOOK VERIFY TOKEN"
}  
```
Alternatively, you can set the above as environment variables.
4. Run `npm install` in the repo directory
5. Run `node index.js` to start the webhook

## Using the bot

1. Send a message
2. Tap the 'Handover to Page Inbox' quick reply
3. Go to your Page Inbox and reply to the conversation
4. Check the 'Done' checkbox or tap the 'Handover to Bot' quick reply
5. Tap the 'Send to Inbox' quick reply.
6. Tap the 'Take from Inbox' quick reply.
