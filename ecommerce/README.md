# e-commerce Example Bot

This app is a basic demo of using the Messenger Platform's payment options.

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
3. Update the values of `PAGE_ACCESS_TOKEN`, `SERVER_URL` and `TOKEN` (to the URL of the server for the bot) or set them as environment variables.
4. Update the values of `keyPublishable` and `keySecret` to those form your Stripe account. Or set them as environment variables.
5. Run `npm install` in the repo directory
6. Run `node index.js` to start the webhook
7. Configure the webhook in your Facebook app settings
8. Subscribe the Facebook app to receive webhook events for your Page

## Using the bot

1. Type the message 'daily deals' to the bot.