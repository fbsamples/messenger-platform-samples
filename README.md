# Messenger Platform Sample

This is a sample project showcasing the Facebook Messenger Platform. You can go through the [walk-through](https://developers.facebook.com/docs/messenger-platform/quickstart) to understand how it works in more detail. The [Complete Guide](https://developers.facebook.com/docs/messenger-platform/implementation) goes deeper into the features available.

Visit the [dev site](https://developers.facebook.com/docs/messenger-platform/) to find out more details about the Messenger Platform.

=======
# Messenger Platform Sample -- .net core

This project is an example server for Messenger Platform built in Microsoft .Net Core v1. With this app, you can send it messages and it will echo them back to you. You can also see examples of the different types of Structured Messages. 

It contains the following functionality:

* Webhook (specifically for Messenger Platform events)
* Send API 
* Web Plugins
* Messenger Platform v1.1 features

Follow the [walk-through](https://developers.facebook.com/docs/messenger-platform/quickstart) to learn about this project in more detail.

## Setup

Set the values in `appsettings.json` before running the sample. Descriptions of each parameter can be found in `app.js`. Alternatively, you can set the corresponding environment variables as defined in `app.js`.

## Run

You can start the server by running `dotnet run`. However, the webhook must be at a public URL that the Facebook servers can reach. Therefore, running the server locally on your machine will not work.

You can run this example on a cloud service provider like Microsoft Azure. Note that webhooks must have a valid SSL certificate, signed by a certificate authority. Read more about setting up SSL for a [Webhook](https://developers.facebook.com/docs/graph-api/webhooks#setup).

## Webhook

All webhook code is in the `Controllers\WebhookController.cs`. It is routed to `/webhook`. This project handles callbacks for authentication, messages, delivery confirmation and postbacks. More details are available at the [reference docs](https://developers.facebook.com/docs/messenger-platform/webhook-reference).

## License

See the LICENSE file in the root directory of this source tree. Feel free to useand modify the code.

