
using System;
using System.Collections.Generic;
using fb_messenger_bot_tt_emergencyservices.Handlers;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace fb_messenger_bot_tt_emergencyservices
{
   /*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message' 
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some 
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've 
 * created. If we receive a message with an attachment (image, video, audio), 
 * then we'll simply confirm that we've received the attachment.
 * 
 */
    public class MessageHandler<T> : IMessengerHandler
    {
        ILogger<T> _logger;
        IMessageSender _messageSender;
        string _serverUrl;
        Dictionary<string, dynamic> _messageTypeExamples;
        public MessageHandler (ILogger<T> logger, IMessageSender messageSender, string serverUrl)
        {
            _logger = logger;
            _messageSender = messageSender;
            _serverUrl = serverUrl;
            LoadMessageTypeExamples();
        }

        private void LoadMessageTypeExamples()
        {
            _messageTypeExamples = new Dictionary<string, dynamic>();
            var simpleExamples = new List<dynamic>();
            simpleExamples.Add(new { name="image", type = "image", asset = "rift.png" });
            simpleExamples.Add(new { name="gif", type = "image", asset = "instagram_logo.gif" });
            simpleExamples.Add(new { name="audio", type = "audio", asset = "sample.mp3" });
            simpleExamples.Add(new { name="video", type = "video", asset = "allofus480.mov" });
            simpleExamples.Add(new { name="file", type = "file", asset = "test.txt" });
            simpleExamples.ForEach(AddToMessageTypes);
            
            _messageTypeExamples.Add("button", new 
            {
                attachment = new {
                    type= "template",
                    payload = new {
                        template_type= "button",
                        text= "This is test text",
                        buttons=new dynamic[]{
                            new {
                                type= "web_url",
                                url= "http://www.teleioscodejam.com/",
                                title= "Open Web URL"
                            }, 
                            new {
                                type= "postback",
                                title= "Trigger Postback",
                                payload= "DEVELOPED_DEFINED_PAYLOAD"
                            }, 
                            new {
                                type= "phone_number",
                                title= "Call Teleios",
                                payload= "number= "+"+18686220940"
                            }}
                    }
                }
            });

            _messageTypeExamples.Add("generic", new 
            {
                attachment = new {
                    type= "template",
                    payload = new {
                        template_type= "generic",
                        elements= new dynamic[]{new {
                            title= "rift",
                            subtitle= "Next-generation virtual reality",
                            item_url= "https://www.oculus.com/en-us/rift/",               
                            image_url= _serverUrl + "/assets/rift.png",
                            buttons= new dynamic[]{new {
                            type= "web_url",
                            url= "https://www.oculus.com/en-us/rift/",
                            title= "Open Web URL"
                            }, new {
                            type= "postback",
                            title= "Call Postback",
                            payload= "Payload for first bubble",
                            }},
                        }, new {
                            title= "touch",
                            subtitle= "Your Hands, Now in VR",
                            item_url= "https://www.oculus.com/en-us/touch/",               
                            image_url= _serverUrl + "/assets/touch.png",
                            buttons= new dynamic[]{new {
                            type= "web_url",
                            url= "https://www.oculus.com/en-us/touch/",
                            title= "Open Web URL"
                            }, new {
                            type= "postback",
                            title= "Call Postback",
                            payload= "Payload for second bubble",
                            }}
                        }}
                        }
                }
            });
            
            var receiptId = "order"+ new Random().Next(10000, 100000);

            _messageTypeExamples.Add("receipt", new 
            {
                attachment = new {
                    type= "template",
                    payload = new {
                        template_type= "receipt",
                        recipient_name= "Peter Chang",
                        order_number= receiptId,
                        currency= "USD",
                        payment_method= "Visa 1234",        
                        timestamp= "1428444852", 
                        elements= new dynamic[]{new {
                            title= "Oculus Rift",
                            subtitle= "Includes= headset, sensor, remote",
                            quantity= 1,
                            price= 599.00,
                            currency= "USD",
                            image_url= _serverUrl + "/assets/riftsq.png"
                        }, new {
                            title= "Samsung Gear VR",
                            subtitle= "Frost White",
                            quantity= 1,
                            price= 99.99,
                            currency= "USD",
                            image_url= _serverUrl + "/assets/gearvrsq.png"
                        }},
                        address= new {
                            street_1= "1 Hacker Way",
                            street_2= "",
                            city= "Menlo Park",
                            postal_code= "94025",
                            state= "CA",
                            country= "US"
                        },
                        summary= new {
                            subtotal= 698.99,
                            shipping_cost= 20.00,
                            total_tax= 57.67,
                            total_cost= 626.66
                        },
                        adjustments= new dynamic[]{new {
                            name= "New Customer Discount",
                            amount= -50
                        }, new {
                            name= "$100 Off Coupon",
                            amount= -100
                        }}
                        }
                }
            });


        }



        private void AddToMessageTypes(dynamic simpleType)
        {
            _messageTypeExamples.Add(simpleType.name, new 
                {
                    attachment = new {
                        type = simpleType.type,
                        payload = new {
                        url= _serverUrl + "/assets/"+simpleType.asset
                        }
                    }
                }
            );
        }

        public bool MessageHandled(dynamic message)
        {
            var result = message.message != null;
            if (result)
            {
                string senderID = message.sender.id;
                string recipientID = message.recipient.id;
                string timeOfMessage = message.timestamp;
                dynamic text = message.message;
                _logger.LogInformation(
                    string.Format("Received message for user {0} and page {1} at {2} with message:", 
                        senderID, recipientID, timeOfMessage));
                string textData= text.ToString();
                _logger.LogInformation(textData);
                
                var isEcho = text.is_echo != null;
                string messageId = text.mid;
                string appId = text.app_id;
                var metadata = text.metadata;
                
                  // You may get a text or attachment but not both
                string messageText = text.text;
                var messageAttachments = text.attachments;
                var quickReply = text.quick_reply;

                if (isEcho) {
                    // Just logging message echoes to console
                    _logger.LogInformation(
                        string.Format("Received echo for message {0} and app {1} with metadata {2}", 
                    messageId, appId, (string)metadata));
                    return true;
                } else if (quickReply != null) {
                    var quickReplyPayload = quickReply.payload;
                    _logger.LogInformation(string.Format("Quick reply for message {0} with payload {1}",
                    messageId, (string)quickReplyPayload));

                    _messageSender.SendTextMessage(senderID, "Quick reply tapped");
                    return true;
                }

                if (messageText != null)
                {
                    // If we receive a text message, check to see if it matches any special
                    // keywords and send back the corresponding example. Otherwise, just echo
                    // the text we received.
                    switch (messageText)
                    {
                        case "image":
                            SendMessage(senderID, "image");
                            break;

                        case "gif":
                            SendMessage(senderID, "gif");
                            break;

                        case "audio":
                            SendMessage(senderID, "audio");
                            break;

                        case "video":
                            SendMessage(senderID, "video");
                            break;

                        case "file":
                            SendMessage(senderID, "file");
                            break;

                        case "button":
                            SendMessage(senderID, "button");
                            break;

                        case "generic":
                            SendMessage(senderID, "generic");
                            break;

                        case "receipt":
                            SendMessage(senderID, "receipt");
                            break;

                        // case "quick reply":
                        //     sendQuickReply(senderID);
                        //     break;        

                        // case "read receipt":
                        //     sendReadReceipt(senderID);
                        //     break;        

                        // case "typing on":
                        //     sendTypingOn(senderID);
                        //     break;        

                        // case "typing off":
                        //     sendTypingOff(senderID);
                        //     break;        

                         case "account linking":
                            SendAccountLinking(senderID);
                            break;
                        default:
                             _messageSender.SendTextMessage(senderID, messageText);
                             break;

                    }
                }
                else if (messageAttachments != null)
                {
                    _messageSender.SendTextMessage(senderID, "Message with attachment received");                    
                }

                    
            }
            return result;
        }

        private void SendMessage(string recipientId, string type)
        {
            var messageData = JObject.FromObject(new
            {
                recipient = new
                {
                    id= recipientId
                },
                message = _messageTypeExamples[type]
            });
            var data = messageData.ToString();
            _logger.LogInformation("About to send");
            _logger.LogInformation(data);

            _messageSender.CallSendAPI(messageData);
        }

        /*
* Send a message with the account linking call-to-action
*
*/
        private void SendAccountLinking(string recipientId)
        {
            var messageData = JObject.FromObject(new
            {
                recipient = new
                {
                    id= recipientId
                },
                message = new 
                {
                    attachment = new {
                        type = "template",
                        payload = new {
                        template_type =  "button",
                        text = "Welcome. Link your account.",
                        buttons = new[]{ new {
                            type = "account_link",
                            url = _serverUrl + "/authorize"
                        }}
                        }
                    }
                }
            });

            _messageSender.CallSendAPI(messageData);

        }
    }
}
