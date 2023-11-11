/* Copyright (c) Meta Platforms, Inc. and affiliates.
* All rights reserved.
*
* This source code is licensed under the license found in the
* LICENSE file in the root directory of this source tree.
*/

import fetch from "node-fetch";

export enum Platforms {
	Messenger = "messenger",
	Instagram = "instagram",
}

export class Messenger {
	apiDomain : string = "graph.facebook.com";
	apiVersion : string = "15.0";
	apiUrl : string;
	platform : Platforms;
	pageId : string;
	accessToken : string;

	constructor( platform : Platforms, pageId : string, accessToken : string ) {
		this.apiUrl =`https://${this.apiDomain}/v${this.apiVersion}`;
		this.platform = platform;
		this.pageId = pageId;
		this.accessToken = accessToken;
	}

	async #sendApiRequest( api : string, parameters : { [ key : string ] : string | string[] }, method : string = "GET" ) {
		parameters[ "access_token" ] = this.accessToken;
		const queryString = new URLSearchParams( parameters );
		return await fetch( `${this.apiUrl}/${api}?${queryString.toString()}`, { method } ).then( r => r.json() );
	}

	async getConversations() {
		return await this.#sendApiRequest( `${this.pageId}/conversations`, {
			"platform": this.platform,
		} );
	}

	async getConversationMessages( conversationId : string ) {
		return await this.#sendApiRequest(`conversations/${conversationId}`, {
			"fields": [ "id", "messages" ],
		} );
	}

	async getMessageDetails( messageId : string ) {
		return await this.#sendApiRequest( `${messageId}`, {
			"fields": [ "id", "to", "from", "message" ],
		} );
	}

	async sendTextMessage( userId : string, message : string ) {
		return await this.#sendApiRequest( `${this.pageId}/messages`, {
			"recipient": JSON.stringify( { "id": userId } ),
			"messaging_type": "RESPONSE",
			"message": JSON.stringify( { "text": message } ),
		}, "POST" );
	}

	async sendImage( userId : string, imageUrl : string ) {
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
