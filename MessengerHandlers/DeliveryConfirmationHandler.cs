
using fb_messenger_bot_tt_emergencyservices.Handlers;
using Microsoft.Extensions.Logging;

namespace fb_messenger_bot_tt_emergencyservices
{
/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
    public class DeliveryConfirmationHandler<T> : IMessengerHandler
    {
        ILogger<T> _logger;
        public DeliveryConfirmationHandler (ILogger<T> logger)
        {
            _logger = logger;
        }
        public bool MessageHandled(dynamic message)
        {
            var result = message.delivery != null;
            if (result)
            {
                var senderID = message.sender.id;
                var recipientID = message.recipient.id;
                var delivery = message.delivery;
                var messageIDs = delivery["mids"];
                string watermark = delivery.watermark;
                var sequenceNumber = delivery.seq;

                if (messageIDs != null) {
                    foreach (string messageID in messageIDs)
                    {
                        _logger.LogInformation(
                            string.Format(
                                "Received delivery confirmation for message ID: {0}", 
                        messageID));
                    }
                }
                _logger.LogInformation(string.Format(
                    "All messages before {0} were delivered.", watermark));
                    
            }
            return result;
        }

    }
}
