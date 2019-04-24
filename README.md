Firebase Server SDK for Golang
==============================

This is the Server SDK written in Golang for the 2016 newly announced Firebase
suite of services.

Note that this is not an official SDK written by Google/Firebase.  Firebase only
offers the Server SDK in [Java][1] and [Node.js][2].  This is simply an attempt to
implement the Firebase Server SDK by reverse engineering the official ones.  If
you decide to use this SDK, be warned that you may need to migrate at some point
in the future when Google decides to release an official go SDK.

This SDK, like its Java and Node counterparts, supports the following functions
needed on the application server:

- Authentication
  * Create custom tokens suitable for integrating custom auth systems with
    Firebase apps.
  * Verify ID tokens, which are used to pass the signed-in user from a client app
    to a backend server.
- Realtime Database
  * This is a lot more involved so stay tuned.
  * For now you can use [firego][5] or [Go Firebase][6], which are based on the
    Firebase [REST API][7].  These libraries are not real-time but they will
    allow you to read from and write to the Firebase database.  Note that
    if you use firego, I recommend using my [forked branch][9], which allows you
    to use the [application default token source][10] (which refreshes itself).
- Cloud Messaging (FCM)
  * This is not offered even in the official Server SDKs, but it would be
    convenient to include this feature.
  * If you wish to use a separate client library for this feature, you can try
    [wuman/go-gcm][11] or [google/go-gcm][12].

Installation
------------

Install the package with go:

    go get github.com/wuman/firebase-server-sdk-go

Import the package to your go file:

    import (
    	firebase "github.com/wuman/firebase-server-sdk-go"
    )

Documentation
-------------

You can find documentation on [godoc.org][8].

Initialize Firebase
-------------------

Once you have created a [Firebase console][3] project and downloaded a JSON file
with your service account credentials, you can initialize the SDK with this
code snippet:

    firebase.InitializeApp(&firebase.Options{
    	ServiceAccountPath: "path/to/serviceAccountCredentials.json",
    })

Create Custom Tokens
--------------------

To create a custom token, pass the unique user ID used by your auth system to
the CreateCustomToken() method:

    auth, _ := firebase.GetAuth()
    token, err := auth.CreateCustomToken(userId, nil)

You can also optionally specify additional claims to be included in the custom
token.  These claims will be available in the `auth/request.auth` objects in
your Security Rules.  For example:

    auth, _ := firebase.GetAuth()
	developerClaims = make(firebase.Claims)
	developerClaims["premium_account"] = true
    token, err := auth.CreateCustomToken(userId, &developerClaims)

Verify ID Tokens
----------------

To verify and decode an ID Token with the SDK, pass the ID Token to the
VerifyIDToken method.  If the ID Token is not expired and is properly signed,
the method decodes the ID Token.

    auth, _ := firebase.GetAuth()
    decodedToken, err := auth.VerifyIDToken(idTokenString)
    if err == nil {
    	uid, found := decodedToken.Uid()
    }

To-Do List
----------

- [ ] add travis CI
- [ ] add sample
- [ ] remove dependency on JWT library [jose][4] to keep the SDK lean (low priority)

Developed By
------------

* David Wu - <david@wu-man.com> - [http://blog.wu-man.com](http://blog.wu-man.com)

LICENSE
-------

    Copyright 2016 David Wu

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

[1]: https://firebase.google.com/docs/reference/serverreference/packages
[2]: https://firebase.google.com/docs/reference/node/
[3]: https://firebase.google.com/console/ 
[4]: https://github.com/SermoDigital/jose
[5]: https://github.com/zabawaba99/firego
[6]: https://github.com/JustinTulloss/firebase
[7]: https://firebase.google.com/docs/reference/rest/database/
[8]: https://godoc.org/github.com/wuman/firebase-server-sdk-go
[9]: https://github.com/wuman/firego/tree/service-account-access-token
[10]: https://developers.google.com/identity/protocols/application-default-credentials
[11]: https://github.com/wuman/go-gcm
[12]: https://github.com/google/go-gcm
