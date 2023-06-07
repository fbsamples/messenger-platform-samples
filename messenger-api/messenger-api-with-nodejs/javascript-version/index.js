/* Copyright (c) Meta Platforms, Inc. and affiliates.
* All rights reserved.
*
* This source code is licensed under the license found in the
* LICENSE file in the root directory of this source tree.
*/

require( "dotenv" ).config();
const { Platforms, Messenger } = require( "./messenger" );

if( !process.env.PAGE_ID ) { throw new Error( "Missing Page ID" ); }
if( !process.env.PAGE_TOKEN ) { throw new Error( "Missing Page Token" ); }

async function getLatestConversationMessage( messenger ) {
    // Get the latest conversations
    const conversations = await messenger.getConversations();
	console.log( conversations );

	// Take the latest conversation and retrieve message IDs
	const latestConversation = conversations.data[ 0 ];
	const messages = await messenger.getConversationMessages( latestConversation.id );
	console.log( messages );

    // Retrieve the latest message using the message ID
	const latestMessage = messages.messages.data[ 0 ];
	const message = await messenger.getMessageDetails( latestMessage.id );
	console.log( message );

    return message;
}

// Send a Facebook Message
const facebook = new Messenger( Platforms.Messenger, process.env.PAGE_ID, process.env.PAGE_TOKEN );
getLatestConversationMessage( facebook ).then( message => {
    // Get the User ID from the latest message
    let userId = message.from.id;
    // If the last message was sent by us, switch it to the recipient ID
    if( userId === process.env.PAGE_ID ) {
        userId = message.to.data[ 0 ].id;
    }
	facebook.sendTextMessage( userId, "Hello!" );
} );

// Send an Instagram Message
const instagram = new Messenger( Platforms.Instagram, process.env.PAGE_ID, process.env.PAGE_TOKEN );
getLatestConversationMessage( instagram ).then( message => {
    // Get the User ID from the latest message
    let userId = message.from.id;
    // Use the username to check the sender of the message
    if( message.from.username === process.env.INSTAGRAM_USERNAME ) {
        userId = message.to.data[ 0 ].id;
    }
	instagram.sendTextMessage( userId, "Hello!" );
	// instagram.sendImage( userId, [IMAGE_URL] );
} );
