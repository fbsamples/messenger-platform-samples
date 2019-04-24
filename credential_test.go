package firebase

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCredential(t *testing.T) {
	f, err := os.Open("testdata/service-account-appengine.json")
	assert.NoError(t, err)
	defer f.Close()

	c, err := loadCredential(f)
	assert.NoError(t, err)

	assert.Equal(t, "myapp-dev", c.ProjectID)
	assert.Equal(t, "myapp-dev@appspot.gserviceaccount.com", c.ClientEmail)
	assert.NotNil(t, c.PrivateKey)
}
