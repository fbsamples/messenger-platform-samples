# Handover Protocol Example Bot

This is a starter app for building a basic app that uses the Messenger Platform's handover protocol.

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
6. Configure the webhook in your Facebook app settings
7. Subscribe the Facebook app to receive webhook events for your Page

## Using the bot

To download the runnable version of this bot, go to this project in the master branch.