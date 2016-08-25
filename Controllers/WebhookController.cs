using System;
using System.Collections.Generic;
using System.Net.Http;
using fb_messenger_bot_tt_emergencyservices.Handlers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace fb_messenger_bot_tt_emergencyservices.Controllers
{
    [Route("[controller]")]
    public class WebhookController : Controller, IMessageSender
    {
        private MessengerSettings Settings { get; set; }
        private readonly ILogger<WebhookController> _logger;
        private List<IMessengerHandler> _handlers;

        public WebhookController(
            IOptions<MessengerSettings> settings, 
            ILogger<WebhookController> logger)
        {            
            Settings = settings.Value;
            _logger = logger;
            _handlers = new List<IMessengerHandler>();
            _handlers.Add(new AuthenticationHandler<WebhookController>(_logger, this));
            _handlers.Add(new MessageHandler<WebhookController>(_logger, this, Settings.ServerURL));
            _handlers.Add(new DeliveryConfirmationHandler<WebhookController>(_logger));
            _handlers.Add(new PostbackHandler<WebhookController>(_logger, this));
            _handlers.Add(new MessageReadHandler<WebhookController>(_logger));
            _handlers.Add(new AccountLinkedHandler<WebhookController>(_logger));            
        }
        [HttpGet]
        public string Get()
        {
            var req = Request;
            var res = Response;
            var result = string.Empty;
            if (req.Query["hub.mode"] == "subscribe"
                && req.Query["hub.verify_token"] == Settings.FBValidationToken) 
            {
                _logger.LogInformation("Validating webhook");
                res.StatusCode = 200;
                result = req.Query["hub.challenge"];
            }
            else 
            {
                _logger.LogError("Failed validation. Make sure the validation tokens match.");
                res.StatusCode = 403;          
            }
            return result;  
        }

        // POST /webhook
        [HttpPost]
        public void Post([FromBody]dynamic data)
        {
            if (data["object"] == "page") {
                var entries = data["entry"];
                foreach (var pageEntry in entries)
                {
                    var pageID = pageEntry.id;
                    var timeOfEvent = pageEntry.time;
                    var handled = false;
                    foreach (var messagingEvent in pageEntry["messaging"])
                    {
                        foreach (var handler in _handlers)
                        {
                            if (handled || (handled = handler.MessageHandled(messagingEvent)))
                                break;
                        }
                        if (!handled)
                        {
                            string meventText = messagingEvent.ToString();
                            _logger.LogInformation(
                                string.Format("Webhook received unknown messagingEvent: {0}",
                                meventText));
                        }
                    }
                    
                }  
            }

        }

        public void SendTextMessage(string recipientId, string messageText)
        {
            _logger.LogInformation("Send: "+messageText);

            var messageData = JObject.FromObject(new
            {
                recipient = new
                {
                    id= recipientId
                },
                message = new 
                {
                    text = messageText,
                    metadata = "DEVELOPER_DEFINED_METADATA"
                }
            });
            CallSendAPI(messageData);
        }

        public async void CallSendAPI(JObject messageData)
        {
            using (var client = new HttpClient())
            {
                var requestUri = "https://graph.facebook.com/v2.6/me/messages?access_token="
                    + Settings.FBPageAccessToken;
                client.BaseAddress = new Uri(requestUri);
                client.DefaultRequestHeaders.Accept.Clear();
                var response = await client.PostAsJsonAsync(requestUri, messageData);

                if (response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsAsync<dynamic>();
                    string recipientId = body.recipient_id;
                    string messageId = body.message_id;

                    if (messageId != null) {
                        _logger.LogInformation(
                            string.Format("Successfully sent message with id {0} to recipient {1}", 
                        messageId, recipientId));
                    } else {
                    _logger.LogInformation(string.Format("Successfully called Send API for recipient {0}", 
                        recipientId));
                    }    
                }
                else{
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError(-1, null, error);
                }
            }


        }
    }
}
