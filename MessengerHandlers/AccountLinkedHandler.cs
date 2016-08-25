using fb_messenger_bot_tt_emergencyservices.Handlers;
using Microsoft.Extensions.Logging;

namespace fb_messenger_bot_tt_emergencyservices
{
    /*
    * Account Link Event
    *
    * This event is called when the Link Account or UnLink Account action has been
    * tapped.
    * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
    * 
    */
    public class AccountLinkedHandler<T> : IMessengerHandler
    {
        ILogger<T> _logger;
        public AccountLinkedHandler (ILogger<T> logger)
        {
            _logger = logger;
        }
        public bool MessageHandled(dynamic message)
        {
            var result = message.account_linking != null;
            if (result)
            {
                string senderID = message.sender.id;
                var recipientID = message.recipient.id;

                string status = message.account_linking.status;
                string authCode = message.account_linking.authorization_code;

                _logger.LogInformation(
                    string.Format("Received account link event with for user {0} with status {1} " +
                "and auth code {2} ", senderID, status, authCode));
            }
            return result;
        }

    }
}
