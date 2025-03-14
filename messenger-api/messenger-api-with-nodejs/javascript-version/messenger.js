/* Copyright (c) Meta Platforms, Inc. and affiliates.
* All rights reserved.
*
* This source code is licensed under the license found in the
* LICENSE file in the root directory of this source tree.
*/

const fetch = require( "node-fetch" );

const Platforms = {
	Messenger: "messenger",
	Instagram: "instagram",
};

class Messenger {
	apiDomain = "graph.facebook.com";
	apiVersion = "15.0";
	apiUrl;
	platform;
	pageId;
	accessToken;

	constructor( platform, pageId, accessToken ) {
		this.apiUrl =`https://${this.apiDomain}/v${this.apiVersion}`;
		this.platform = platform;
		this.pageId = pageId;
		this.accessToken = accessToken;
	}

	async #sendApiRequest( api, parameters, method = "GET" ) {
		parameters[ "access_token" ] = this.accessToken;
		const queryString = new URLSearchParams( parameters );
		return await fetch( `${this.apiUrl}/${api}?${queryString.toString()}`, { method } ).then( r => r.json() );
	}

	async getConversations() {
		return await this.#sendApiRequest( `${this.pageId}/conversations`, {
			"platform": this.platform,
		} );
	}

	async getConversationMessages( conversationId ) {
		return await this.#sendApiRequest( `${conversationId}`, {
			"fields": [ "id", "messages" ],
		} );
	}

	async getMessageDetails( messageId ) {
		return await this.#sendApiRequest( `${messageId}`, {
			"fields": [ "id", "to", "from", "message" ],
		} );
	}

	async sendTextMessage( userId, message ) {
		return await this.#sendApiRequest( `${this.pageId}/messages`, {
			"recipient": JSON.stringify( { "id": userId } ),
			"messaging_type": "RESPONSE",
			"message": JSON.stringify( { "text": message } ),
		}, "POST" );
	}

	async sendImage( userId, imageUrl ) {
		return await this.#sendApiRequest( `${this.pageId}/messages`, {
			"recipient": JSON.stringify( { "id": userId } ),
			"messaging_type": "RESPONSE",
			"message": JSON.stringify( {
				"attachment": {
					"type": "image",
					"payload": {
						"url": imageUrl,
					},
				},
			} ),
		}, "POST" );
	}
}

module.exports = { Platforms, Messenger };
