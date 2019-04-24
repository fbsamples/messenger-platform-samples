package firebase

import (
	"crypto/rsa"
	"encoding/json"
	"io"

	"github.com/SermoDigital/jose/crypto"
)

// GoogleServiceAccountCredential is the credential for a GCP Service Account.
type GoogleServiceAccountCredential struct {
	// ProjectID is the project ID.
	ProjectID string
	// PrivateKey is the RSA256 private key.
	PrivateKey *rsa.PrivateKey
	// ClientEmail is the client email.
	ClientEmail string
}

// UnmarshalJSON is the custom unmarshaler for GoogleServiceAccountCredential.
// Private key is parsed from PEM format.
func (c *GoogleServiceAccountCredential) UnmarshalJSON(data []byte) error {
	var aux struct {
		ProjectID   string `json:"project_id"`
		PrivateKey  string `json:"private_key"`
		ClientEmail string `json:"client_email"`
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	privKey, err := crypto.ParseRSAPrivateKeyFromPEM([]byte(aux.PrivateKey))
	if err != nil {
		return err
	}
	c.PrivateKey = privKey

	c.ProjectID = aux.ProjectID
	c.ClientEmail = aux.ClientEmail
	return nil
}

// loadCredential loads the Service Account credential from a JSON file.
func loadCredential(r io.Reader) (*GoogleServiceAccountCredential, error) {
	var c GoogleServiceAccountCredential
	if err := json.NewDecoder(r).Decode(&c); err != nil {
		return nil, err
	}
	return &c, nil
}
