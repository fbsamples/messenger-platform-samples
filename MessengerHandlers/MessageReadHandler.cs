
using fb_messenger_bot_tt_emergencyservices.Handlers;
using Microsoft.Extensions.Logging;

namespace fb_messenger_bot_tt_emergencyservices
{
/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
    public class MessageReadHandler<T> : IMessengerHandler
    {
        ILogger<T> _logger;
        public MessageReadHandler (ILogger<T> logger)
        {
            _logger = logger;
        }
        public bool MessageHandled(dynamic message)
        {
            var result = message.read != null;
            if (result)
            {
                var senderID = message.sender.id;
                var recipientID = message.recipient.id;

                // All messages before watermark (a timestamp) or sequence have been seen.
                string watermark = message.read.watermark;
                string sequenceNumber = message.read.seq;

                _logger.LogInformation(
                    string.Format("Received message read event for watermark {0} and sequence " +
                "number {1}", watermark, sequenceNumber));
            }
            return result;
        }

    }
}
