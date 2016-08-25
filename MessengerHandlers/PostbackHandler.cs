
using fb_messenger_bot_tt_emergencyservices.Handlers;
using Microsoft.Extensions.Logging;

namespace fb_messenger_bot_tt_emergencyservices
{
 /*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
    public class PostbackHandler<T> : IMessengerHandler
    {
        ILogger<T> _logger;
        IMessageSender _messageSender;
        public PostbackHandler (ILogger<T> logger, IMessageSender messageSender)
        {
            _logger = logger;
            _messageSender = messageSender;
        }
        public bool MessageHandled(dynamic message)
        {
            var result = message.postback != null;
            if (result)
            {
                string senderID = message.sender.id;
                string recipientID = message.recipient.id;
                string timeOfPostback = message.timestamp;

                // The 'payload' param is a developer-defined field which is set in a postback 
                // button for Structured Messages. 
                var payload = message.postback.payload;
                string pyldText = payload.ToString();

                _logger.LogInformation(
                    string.Format("Received postback for user {0} and page {1} with payload '{2}' " + 
                    "at {3}", senderID, recipientID, pyldText, timeOfPostback));

                // When a postback is called, we'll send a message back to the sender to 
                // let them know it was successful
                _messageSender.SendTextMessage(senderID, "Postback called");
                    
            }
            return result;
        }

    }
}
