package firebase

import (
	"errors"
	"fmt"
	"time"

	"net/http"

	"github.com/SermoDigital/jose/crypto"
	"github.com/SermoDigital/jose/jws"
	"github.com/SermoDigital/jose/jwt"
)

// clientCertURL is the URL containing the public keys for the Google certs
// (whose private keys are used to sign Firebase Auth ID Tokens).
const clientCertURL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

// defaultAcceptableExpSkew is the default expiry leeway.
const defaultAcceptableExpSkew = 300 * time.Second

func verify(projectID, tokenString string, transport http.RoundTripper) (*Token, error) {
	decodedJWT, err := jws.ParseJWT([]byte(tokenString))
	if err != nil {
		return nil, err
	}
	decodedJWS, ok := decodedJWT.(jws.JWS)
	if !ok {
		return nil, errors.New("Firebase Auth ID Token cannot be decoded")
	}

	keys := func(j jws.JWS) ([]interface{}, error) {
		certs := &Certificates{URL: clientCertURL, Transport: transport}

		kid, ok := j.Protected().Get("kid").(string)
		if !ok {
			return nil, errors.New("Firebase Auth ID Token has no 'kid' claim")
		}
		cert, err := certs.Cert(kid)
		if err != nil {
			return nil, err
		}
		return []interface{}{cert.PublicKey}, nil
	}

	err = decodedJWS.VerifyCallback(keys,
		[]crypto.SigningMethod{crypto.SigningMethodRS256},
		&jws.SigningOpts{Number: 1, Indices: []int{0}})
	if err != nil {
		return nil, err
	}

	ks, _ := keys(decodedJWS)
	key := ks[0]
	if err := decodedJWT.Validate(key, crypto.SigningMethodRS256, validator(projectID)); err != nil {
		return nil, err
	}

	return &Token{delegate: decodedJWT}, nil
}

func validator(projectID string) *jwt.Validator {
	v := &jwt.Validator{}
	v.EXP = defaultAcceptableExpSkew
	v.SetAudience(projectID)
	v.SetIssuer(fmt.Sprintf("https://securetoken.google.com/%s", projectID))
	v.Fn = func(claims jwt.Claims) error {
		subject, ok := claims.Subject()
		if !ok || len(subject) == 0 || len(subject) > 128 {
			return jwt.ErrInvalidSUBClaim
		}
		return nil
	}
	return v
}
