package firebase

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Certificates holds a collection of public certificates that are fetched from
// a given URL.  The certificates can be reloaded when the cached certs are
// expired.
type Certificates struct {
	// URL to retrieve the public certificates, meant to be initialized only once.
	URL string
	// Transport is the network transport, meant to be initialized only once.
	Transport http.RoundTripper
	// lock for the certs and the exp
	sync.RWMutex
	// certs is a map of all the public x509 certificates hosted at URL.
	certs map[string]*x509.Certificate
	// exp is the expiry time for the certificates.
	exp time.Time
}

// Cert returns the public certificate for the given key ID.
func (c *Certificates) Cert(kid string) (*x509.Certificate, error) {
	if err := c.ensureLoaded(); err != nil {
		return nil, err
	}
	c.RLock()
	defer c.RUnlock()
	cert, found := c.certs[kid]
	if !found {
		return nil, fmt.Errorf("certificate not found for key ID: %s", kid)
	}
	return cert, nil
}

// ensureLoaded ensures that certificates are loaded, while reusing cached
// certs that have not expired yet.
func (c *Certificates) ensureLoaded() error {
	c.RLock()
	if c.exp.After(time.Now()) {
		// skip if the cached certs have not yet expired
		return nil
	}
	c.RUnlock()

	certs, cacheTime, err := download(c.URL, c.Transport)
	if err != nil {
		return err
	}

	c.Lock()
	defer c.Unlock()
	c.certs = certs
	c.exp = time.Now().Add(cacheTime)
	return nil
}

// download fetches the public certificates hosted at a given URL.
func download(url string, transport http.RoundTripper) (map[string]*x509.Certificate, time.Duration, error) {
	if transport == nil {
		transport = http.DefaultTransport
	}
	client := http.Client{Transport: transport}
	resp, err := client.Get(url)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, 0, fmt.Errorf("download %s fails: %s", url, resp.Status)
	}
	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, 0, err
	}
	certs, err := parse(b)
	if err != nil {
		return nil, 0, err
	}
	return certs, cacheTime(resp), nil
}

// parse parses the certificates response in JSON format.
// The response has the format:
// {
//   "kid1": "-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----",
//   "kid2": "-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----",
// }
func parse(b []byte) (map[string]*x509.Certificate, error) {
	m := make(map[string]string)
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, err
	}
	certs := make(map[string]*x509.Certificate)
	for k, v := range m {
		block, _ := pem.Decode([]byte(v))
		c, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return nil, err
		}
		certs[k] = c
	}
	return certs, nil
}

const defaultCertsCacheTime = 1 * time.Hour

// cacheTime extracts the cache time from the HTTP response header.
// A default cache time is returned if extraction fails.
func cacheTime(resp *http.Response) time.Duration {
	cc := strings.Split(resp.Header.Get("Cache-Control"), ",")
	const maxAge = "max-age="
	for _, c := range cc {
		c = strings.TrimSpace(c)
		if strings.HasPrefix(c, maxAge) {
			if d, err := strconv.Atoi(c[len(maxAge):]); err == nil {
				return time.Duration(d) * time.Second
			}
		}
	}
	return defaultCertsCacheTime
}
