package firebase

import "time"

var clock tickTock = realClock{}

// tickTock tells the current time.  A real clock can be mocked out during test.
type tickTock interface {
	// Now tells the current time.
	Now() time.Time
}

// realClock reports the real current time.
type realClock struct{}

// Now reports the real current time.
func (realClock) Now() time.Time { return time.Now() }
