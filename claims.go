package firebase

// Claims to be stored in a custom token (and made available to security rules
// in Database, Storage, etc.).  These must be serializable to JSON
// (e.g. contains only Maps, Arrays, Strings, Booleans, Numbers, etc.).
type Claims map[string]interface{}
