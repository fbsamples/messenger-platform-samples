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

1. Send any text message to the bot. The bot will respond with a greeting message and 'Pass to Inbox' quick reply.
![Welcome Message](https://github.com/amuramoto/messenger-platform-samples/raw/master/handover_protocol/img/welcome_msg.png)
2. Tap the 'Pass to Inbox' quick reply. The bot will respond with this quick reply:
![Pass to inbox](https://github.com/amuramoto/messenger-platform-samples/raw/master/handover_protocol/img/pass_to_inbox.png)
3. Go to your Page Inbox and reply to the conversation. Messages sent from the Page inbox will appear in the conversation in Messenger.
4. Check the 'Done' checkbox to pass control back to the bot.
![Done button](https://github.com/amuramoto/messenger-platform-samples/raw/master/handover_protocol/img/done.png)
5. Tap the 'Send to Inbox' quick reply. The conversation will be moved to the Page inbox, and the bot will respond with this quick reply:
![Pass to inbox](https://github.com/amuramoto/messenger-platform-samples/raw/master/handover_protocol/img/pass_to_inbox.png)
6. Tap the 'Take from Inbox' quick reply. The bot will respond with this quick reply:
![Take from inbox](https://github.com/amuramoto/messenger-platform-samples/raw/master/handover_protocol/img/take_control.png)
