using Newtonsoft.Json.Linq;

namespace fb_messenger_bot_tt_emergencyservices
{
    public interface IMessageSender
    {
        void SendTextMessage(string senderId, string message);

        void CallSendAPI(JObject messageData);
    }
}