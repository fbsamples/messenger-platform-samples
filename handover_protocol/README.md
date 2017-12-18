# Handover Protocol Example Bot

This app is a basic demo of using the Messenger Platform's handover protocol.

## Requirements

To run this app you will need the following:

- Facebook developer account
- Facebook developer app
- Facebook Page
- A server that has Node.js installed

## Setting Up the Bot

1. Set up the app
  1. Download this repo
  2. `cd <REPO_DIRECTORY>`
  3. `npm install`
2. Deploy the app to your server
3. Set the following in the `env` file
  - `PAGE_ACCESS_TOKEN`
  - `VERIFY TOKEN`
4. Run the code
  - `node index.js`
5. Configure the webhook


## Using the bot

1. Send a message
2. Tap the 'Handover to Page Inbox' quick reply
3. Go to your Page Inbox and reply to the conversation
4. Check the 'Done' checkbox or tap the 'Handover to Bot' quick reply