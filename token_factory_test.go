package firebase

import (
	"flag"
	"io/ioutil"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// testClock is a mock tickTock that tells a fake, static current time so that
// tests can be run consistently with expected results.
type testClock struct{}

func (testClock) Now() time.Time { return time.Unix(1464286400, 0) }

func TestMain(m *testing.M) {
	flag.Parse()
	realClock := clock
	clock = testClock{}
	res := m.Run()
	clock = realClock
	os.Exit(res)
}

func TestCreateCustomAuthTokenForUser(t *testing.T) {
	f, _ := os.Open("testdata/service-account-appengine.json")
	defer f.Close()
	c, _ := loadCredential(f)

	_, err := createSignedCustomAuthTokenForUser("", nil, c.ClientEmail, c.PrivateKey)
	assert.EqualError(t, err, "Uid must be provided.")
	_, err = createSignedCustomAuthTokenForUser("myuid", nil, "", c.PrivateKey)
	assert.EqualError(t, err, "Must provide an issuer.")

	developerClaims := make(Claims)
	developerClaims["aud"] = "reserved"
	_, err = createSignedCustomAuthTokenForUser("myuid", &developerClaims, c.ClientEmail, c.PrivateKey)
	assert.EqualError(t, err, "developer_claims cannot contain a reserved key: aud")

	b, _ := ioutil.ReadFile("testdata/token_myuid_golden.txt")
	expected := strings.TrimSpace(string(b))
	developerClaims = make(Claims)
	developerClaims["premium_account"] = true
	token, err := createSignedCustomAuthTokenForUser("myuid", &developerClaims, c.ClientEmail, c.PrivateKey)
	assert.NoError(t, err)
	assert.Equal(t, expected, token)
}

func TestIsReserved(t *testing.T) {
	params := []struct {
		Name     string
		Contains bool
	}{
		{"acr", true},
		{"aud", true},
		{"exp", true},
		{"nbf", true},
		{"claims", false},
		{"z", false},
	}
	for _, p := range params {
		assert.Equal(t, p.Contains, isReserved(p.Name))
	}
}
