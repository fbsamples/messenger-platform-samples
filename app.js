
/* global networking */

const 
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  request = require('request'),
  networking = require('./network'),
  stringUtils = require('./bot.string-utils');
  
const 
    charLimitTitle = 80,
    charLimitButtonTitle = 20,
    charLimitTextMsg = 320; 
  
var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));


/*
 * Be sure to setup your config values before running this code. You can 
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? 
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL. 
 * 
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query['account_linking_token'];
  var redirectURI = req.query['redirect_uri'];

  // Authorization Code should be generated per user by the developer. This will 
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the 
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger' 
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam, 
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s", 
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);
	  switch (quickReplyPayload) {
		case 'CUSTOM_QUICK_DATA_1GB':
			sendTextMessage(senderID, "1gb гэсэн түлхүүр үгийг 123 дугаарт илгээнэ. Дагалдах эрх үйлчилгээний хоног 30. Үнэ 10.000₮"); 
            break;
		case 'CUSTOM_QUICK_DATA_2GB':
			sendTextMessage(senderID, "2gb гэсэн түлхүүр үгийг 123 дугаарт илгээнэ. Дагалдах эрх үйлчилгээний хоног 30. Үнэ 13.000₮"); 
            break;
		case 'CUSTOM_QUICK_DATA_10GB':
			sendTextMessage(senderID, "10gb гэсэн түлхүүр үгийг 123 дугаарт илгээнэ. Дагалдах эрх үйлчилгээний хоног 60. Үнэ 30.000₮"); 
            break;
	  }
    return;
  }

  if (messageText) {

    switch (messageText) {
      
        
      case '123': 
        send123Buttons(senderID);
        break; 
        
        case 'мэдээ':
            sendNewsMessage(senderID); 
            break; 

     // default:
      //  sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;
  
    console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);
  
    if((/\/^CUSTOM_NEWS_/).test(payload)){
        sendTextMessage(senderID, "CUSTOM_NEWS_ called: "+payload);
    }
    
    switch (payload){
        case 'CUSTOM_123_DATA_PACKAGE':
			sendDataQuickReply(senderID); 
            break; 
        case 'CUSTOM_123_FB_PACKAGE':
            sendTextMessage(senderID, "Та 123-г ашиглан Facebook багц авахын тулд facebook гэсэн түлхүүр үгийг 123 тусгай дугаарт илгээхэд хангалттай. Дагалдах эрх үйлчилгээний 30 хоног. Үнэ 5000₮");
            break; 
        case 'CUSTOM_123_247_PACKAGE':
            sendTextMessage(senderID, "Та 123-г ашиглан 247 багц авахын тулд 247 гэсэн түлхүүр үгийг 123 тусгай дугаарт илгээхэд хангалттай. Дагалдах эрх үйлчилгээний 30 хоног. Үнэ 5000₮");
            break; 
            
        case 'CUSTOM_NEWS_1':
            sendTextMessage(senderID, "МҮОХ-ны албан ёсны түнш, олимпийн баг тамирчдыг дэмжигч, Монголын 100% хөрөнгө оруулалттай СКАЙтел компани Рио 2016 олимпийн ХҮРЭЛ медальт Доржнямбуугийн Отгондалайд хүндэтгэл үзүүлэн хүлээн авч, компанийнхаа гарын бэлгээр урмын мялаалга өргөлөө."); 
            sendTextMessage(senderID, "Даян дэлхийн эв нэгдлийн их наадам Рио 2016 зуны олимпийн боксыг 60 кг-ийн төрөлд хүч үзэн, эх орондоо хүрэл медаль авчирч, монголчууд биднийхээ магнай тэнийлгэсэн, одтой хийморьтой аавын хүү Д.Отгондалайгаараа бид бахархахгүй байхын аргагүй"); 
            sendTextMessage(senderID, " Иймд СКАЙтел компани Д.Отгондалайгийнхаа хүч хөдөлмөр, баатарлаг гавьяаг үнэлэн, Риогоос Токио 2020 олимп хүртэл буюу 4 жилийн хугацаанд үүрэн холбоо, дата интернетийнх хэрэгцээг хангахаар ");
            sendTextMessage(senderID, "дараа төлбөрт МОНГОЛдоо 70000 багцын үйлчилгээг ашиглах эрхтэй Алтан дугаар, сүүлийн үеийн, өндөр үзүүлэлт бүхий Samsung Galaxy S7 загварын ухаалаг утсаар мялаалаа.");
            sendTextMessage(senderID, "Мөн түүний дасгалжуулагч, ОУХМ Б.Эрдэнэбаярыг МОНГОЛдоо 40000 багцын үйлчилгээний 1 жилийн эрхтэй үнэ цэнэтэй дугаар, ухаалаг утсаар урамшууллаа");
            break; 
        case 'CUSTOM_NEWS_2':
            sendTextMessage(senderID, "Яриа, дата, мессежийн хэрэглээндээ санаа амар байж, төлж буй мөнгөн дүнгээсээ илүү их үнэ цэнийг хүртэх боломжийг СКАЙтелийн дараа төлбөрт МОНГОЛдоо үйлчилгээ бий болгож чадсан."); 
            sendTextMessage(senderID, "Илүү хэмнэлттэй, илүү таатай нөхцөлтэй энэхүү үйлчилгээнд бүх дараа төлбөрт үйлчилгээний хэрэглэгчдээ хамруулах үүднээс 2016 оны 9-р сарын 1-нээс эхлэн одоогийн VIP, Business class 10k, Business class 20k,  Business class 30k болон Open (150, 400, 750, 1500) багцын хэрэглэгчдийг МОНГОЛдоо үйлчилгээний багцуудад дүйцүүлэн шилжүүлэх гэж байна.");
            break; 
        default: 
            // When a postback is called, we'll send a message back to the sender to 
            // let them know it was successful
//            sendTextMessage(senderID, "Postback called");
            break; 
    }
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "/assets/allofus480.mov"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/assets/test.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPED_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+16505551234"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}
//TODO mine 
function send123Buttons(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Танд манай 123 шинэ үйлчилгээг танилцуулж байна",
          buttons:[{
            type: "postback",
            payload: "CUSTOM_123_DATA_PACKAGE",
            title: "Дата багц авах"
          }, {
            type: "postback",
            title: "Facebook багц авах",
            payload: "CUSTOM_123_FB_PACKAGE"
          }, {
            type: "postback",
            title: "247 багц авах",
            payload: "CUSTOM_123_247_PACKAGE"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 * TODO Use this Zolbayar (slider)
 */
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

var newsDetail; 

//TODO mine 
function sendNewsMessage(recipientId) {
    
  networking.getLatestNews((detail) => {
      newsDetail = detail; 
      var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [{
                title: detail[0].title,
                subtitle: stringUtils.getSubWords(detail[0].intro, charLimitTitle),
                item_url: `https://www.skytel.mn/content/${detail[0].id}/view`,               
                image_url: detail[0].image,
                buttons: [{
                  type: "web_url",
                  url: `https://www.skytel.mn/content/${detail[0].id}/view`,
                  title: "Мэдээг унших"
                }, {
                  type: "postback",
                  title: "Тойм унших",
                  payload: `CUSTOM_NEWS_${detail[0].id}`,
                }],
              },{
                title: detail[1].title,
                subtitle: stringUtils.getSubWords(detail[1].intro, charLimitTitle),
                item_url: `https://www.skytel.mn/content/${detail[1].id}/view`,               
                image_url: detail[1].image,
                buttons: [{
                  type: "web_url",
                  url: `https://www.skytel.mn/content/${detail[1].id}/view`,
                  title: "Мэдээг унших"
                }, {
                  type: "postback",
                  title: "Тойм унших",
                  payload: `CUSTOM_NEWS_${detail[1].id}`,
                }],
              },{
                title: detail[2].title,
                subtitle: stringUtils.getSubWords(detail[2].intro, charLimitTitle),
                item_url: `https://www.skytel.mn/content/${detail[2].id}/view`,               
                image_url: detail[2].image,
                buttons: [{
                  type: "web_url",
                  url: `https://www.skytel.mn/content/${detail[2].id}/view`,
                  title: "Мэдээг унших"
                }, {
                  type: "postback",
                  title: "Тойм унших",
                  payload: `CUSTOM_NEWS_${detail[2].id}`,
                }],
              },{
                title: detail[3].title,
                subtitle: stringUtils.getSubWords(detail[3].intro, charLimitTitle),
                item_url: `https://www.skytel.mn/content/${detail[3].id}/view`,               
                image_url: detail[3].image,
                buttons: [{
                  type: "web_url",
                  url: `https://www.skytel.mn/content/${detail[3].id}/view`,
                  title: "Мэдээг унших"
                }, {
                  type: "postback",
                  title: "Тойм унших",
                  payload: `CUSTOM_NEWS_${detail[3].id}`,
                }],
              }]
            }
          }
        }
      };  

      callSendAPI(messageData);
  });
  
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",        
          timestamp: "1428444852", 
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      metadata: "DEVELOPER_DEFINED_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Action",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Comedy",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Drama",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  };

  callSendAPI(messageData);
}
//TODO mine 
function sendDataQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Та дата багцыг 123-с дараах 3-н төрлөөс сонгон авах боломжтой",
      metadata: "ZOL_DEFINED_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title":"1GB",
          "payload":"CUSTOM_QUICK_DATA_1GB"
        },
        {
          "content_type":"text",
          "title":"2GB",
          "payload":"CUSTOM_QUICK_DATA_2GB"
        },
        {
          "content_type":"text",
          "title":"10GB",
          "payload":"CUSTOM_QUICK_DATA_10GB"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error(response.error);
    }
  });  
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.

//var privateKey = fs.readFileSync('/home/www/ssl_old/20150330 SSL/server.key');
//var certificate = fs.readFileSync('/home/www/ssl_old/20150330 SSL/ssl_certificate.crt' );
//https.createServer({
//    key: privateKey,
//    cert: certificate
//}, app).listen(app.get('port'));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

