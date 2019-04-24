package firebase

import (
	"errors"
	"fmt"
	"strings"
	"sync"
)

const (
	defaultAppName = "[DEFAULT]"
)

var apps = struct {
	sync.Mutex
	m map[string]*App
}{
	m: make(map[string]*App),
}

// App is the entry point of the SDK.  It holds common configuration and state
// for Firebase APIs.  Most applications don't need to directly interact with
// App.
type App struct {
	name    string
	options *Options
}

// GetApp retrieves the default instance of the App, creating it if necessary.
func GetApp() (*App, error) {
	return GetAppWithName(defaultAppName)
}

// GetAppWithName retrieves an instance of the App with a given name, creating it if necessary.
func GetAppWithName(name string) (*App, error) {
	apps.Lock()
	defer apps.Unlock()
	name = normalize(name)
	if app, ok := apps.m[name]; ok {
		return app, nil
	}
	return nil, fmt.Errorf("App with name %s not yet initialized!", name)
}

// Name returns the name of the App.
func (app *App) Name() string {
	return app.name
}

func normalize(name string) string {
	return strings.TrimSpace(name)
}

func (app *App) isDefaultApp() bool {
	return app.name == defaultAppName
}

// InitializeApp initializes the default App instance.
func InitializeApp(o *Options) (*App, error) {
	return InitializeAppWithName(o, defaultAppName)
}

// InitializeAppWithName initializes an App with a unique given name.
//
// It is an error to initialize an app with an already existing name.  Starting
// and ending whitespace characters in the name are ignored (trimmed).
func InitializeAppWithName(o *Options, name string) (*App, error) {
	name = normalize(name)
	if name == "" {
		return nil, errors.New("App name cannot be empty")
	}
	if o == nil {
		return nil, errors.New("Options cannot be nil")
	}
	apps.Lock()
	defer apps.Unlock()
	if _, ok := apps.m[name]; ok {
		return nil, fmt.Errorf("App name %s already exists!", name)
	}
	app := &App{
		name:    name,
		options: o,
	}
	apps.m[name] = app
	return app, nil
}
