using fb_messenger_bot_tt_emergencyservices.Handlers;
using Microsoft.Extensions.Logging;

namespace fb_messenger_bot_tt_emergencyservices
{
    /*
    * Handle authorization Events
    *
    * The value for 'optin.ref' is defined in the entry point. For the "Send to 
    * Messenger" plugin, it is the 'data-ref' field. Read more at 
    * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
    *
    */
    public class AuthenticationHandler<T> : IMessengerHandler
    {
        ILogger<T> _logger;
        IMessageSender _messageSender;
        public AuthenticationHandler (ILogger<T> logger, IMessageSender messageSender)
        {
            _logger = logger;
            _messageSender = messageSender;
        }
        public bool MessageHandled(dynamic message)
        {
            var result = message.optin != null;
            if (result)
            {
                string senderID = message.sender.id;
                string recipientID = message.recipient.id;
                string timeOfAuth = message.timestamp;

                // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
                // The developer can set this to an arbitrary value to associate the 
                // authentication callback with the 'Send to Messenger' click event. This is
                // a way to do account linking when the user clicks the 'Send to Messenger' 
                // plugin.
                var optin = message.optin;
                string passThroughParam = optin["ref"];

                _logger.LogInformation(
                    string.Format("Received authentication for user {0} and page {1} with pass " +
                    "through param '{2}' at {3}", senderID, recipientID, passThroughParam, 
                    timeOfAuth));

                // When an authentication is received, we'll send a message back to the sender
                // to let them know it was successful.
                _messageSender.SendTextMessage(senderID, "Authentication successful");

                    
            }
            return result;
        }

    }
}
