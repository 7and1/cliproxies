// Package config provides configuration management for the CLI Proxy API server.
// It handles loading and parsing YAML configuration files, and provides structured
// access to application settings including server port, authentication directory,
// debug settings, proxy configuration, and API keys.
package config

// SDKConfig represents the application's configuration, loaded from a YAML file.
type SDKConfig struct {
	// ProxyURL is the URL of an optional proxy server to use for outbound requests.
	ProxyURL string `yaml:"proxy-url" json:"proxy-url"`

	// ForceModelPrefix requires explicit model prefixes (e.g., "teamA/gemini-3-pro-preview")
	// to target prefixed credentials. When false, unprefixed model requests may use prefixed
	// credentials as well.
	ForceModelPrefix bool `yaml:"force-model-prefix" json:"force-model-prefix"`

	// RequestLog enables or disables detailed request logging functionality.
	RequestLog bool `yaml:"request-log" json:"request-log"`

	// APIKeys is a list of keys for authenticating clients to this proxy server.
	APIKeys []string `yaml:"api-keys" json:"api-keys"`

	// Access holds request authentication provider configuration.
	Access AccessConfig `yaml:"auth,omitempty" json:"auth,omitempty"`

	// Streaming configures server-side streaming behavior (keep-alives and safe bootstrap retries).
	Streaming StreamingConfig `yaml:"streaming" json:"streaming"`

	// ProxyGrid holds Proxy Grid API integration configuration.
	ProxyGrid ProxyGridConfig `yaml:"proxygrid,omitempty" json:"proxygrid,omitempty"`
}

// StreamingConfig holds server streaming behavior configuration.
type StreamingConfig struct {
	// KeepAliveSeconds controls how often the server emits SSE heartbeats (": keep-alive\n\n").
	// <= 0 disables keep-alives. Default is 0.
	KeepAliveSeconds int `yaml:"keepalive-seconds,omitempty" json:"keepalive-seconds,omitempty"`

	// BootstrapRetries controls how many times the server may retry a streaming request before any bytes are sent,
	// to allow auth rotation / transient recovery.
	// <= 0 disables bootstrap retries. Default is 0.
	BootstrapRetries int `yaml:"bootstrap-retries,omitempty" json:"bootstrap-retries,omitempty"`
}

// AccessConfig groups request authentication providers.
type AccessConfig struct {
	// Providers lists configured authentication providers.
	Providers []AccessProvider `yaml:"providers,omitempty" json:"providers,omitempty"`
}

// AccessProvider describes a request authentication provider entry.
type AccessProvider struct {
	// Name is the instance identifier for the provider.
	Name string `yaml:"name" json:"name"`

	// Type selects the provider implementation registered via the SDK.
	Type string `yaml:"type" json:"type"`

	// SDK optionally names a third-party SDK module providing this provider.
	SDK string `yaml:"sdk,omitempty" json:"sdk,omitempty"`

	// APIKeys lists inline keys for providers that require them.
	APIKeys []string `yaml:"api-keys,omitempty" json:"api-keys,omitempty"`

	// Config passes provider-specific options to the implementation.
	Config map[string]any `yaml:"config,omitempty" json:"config,omitempty"`
}

const (
	// AccessProviderTypeConfigAPIKey is the built-in provider validating inline API keys.
	AccessProviderTypeConfigAPIKey = "config-api-key"

	// DefaultAccessProviderName is applied when no provider name is supplied.
	DefaultAccessProviderName = "config-inline"
)

// ConfigAPIKeyProvider returns the first inline API key provider if present.
func (c *SDKConfig) ConfigAPIKeyProvider() *AccessProvider {
	if c == nil {
		return nil
	}
	for i := range c.Access.Providers {
		if c.Access.Providers[i].Type == AccessProviderTypeConfigAPIKey {
			if c.Access.Providers[i].Name == "" {
				c.Access.Providers[i].Name = DefaultAccessProviderName
			}
			return &c.Access.Providers[i]
		}
	}
	return nil
}

// MakeInlineAPIKeyProvider constructs an inline API key provider configuration.
// It returns nil when no keys are supplied.
func MakeInlineAPIKeyProvider(keys []string) *AccessProvider {
	if len(keys) == 0 {
		return nil
	}
	provider := &AccessProvider{
		Name:    DefaultAccessProviderName,
		Type:    AccessProviderTypeConfigAPIKey,
		APIKeys: append([]string(nil), keys...),
	}
	return provider
}

// ProxyGridConfig holds Proxy Grid API integration settings.
type ProxyGridConfig struct {
	// Enabled enables or disables the Proxy Grid integration.
	Enabled bool `yaml:"enabled,omitempty" json:"enabled,omitempty"`

	// BaseURL is the base URL of the Proxy Grid API service.
	// Defaults to http://google.savedimage.com if not specified.
	BaseURL string `yaml:"base-url,omitempty" json:"base-url,omitempty"`

	// Secret is the API secret key for authentication with the Proxy Grid API.
	// Sent via the x-grid-secret header.
	Secret string `yaml:"secret,omitempty" json:"secret,omitempty"`

	// Timeout is the HTTP request timeout in seconds. Defaults to 30.
	Timeout int `yaml:"timeout,omitempty" json:"timeout,omitempty"`

	// RateLimit holds rate limiting configuration for Proxy Grid requests.
	RateLimit ProxyGridRateLimit `yaml:"rate-limit,omitempty" json:"rate-limit,omitempty"`

	// Cache holds cache configuration for Proxy Grid responses.
	Cache ProxyGridCache `yaml:"cache,omitempty" json:"cache,omitempty"`
}

// ProxyGridRateLimit holds rate limiting configuration.
type ProxyGridRateLimit struct {
	// RequestsPerMinute is the maximum number of requests allowed per minute.
	RequestsPerMinute int `yaml:"requests-per-minute,omitempty" json:"requests-per-minute,omitempty"`

	// Burst is the burst size for rate limiting.
	Burst int `yaml:"burst,omitempty" json:"burst,omitempty"`
}

// ProxyGridCache holds cache configuration.
type ProxyGridCache struct {
	// Enabled enables or disables caching of Proxy Grid responses.
	Enabled bool `yaml:"enabled,omitempty" json:"enabled,omitempty"`

	// TTLOverrideMinutes overrides default TTL values in minutes.
	// If set to 0, default service-specific TTLs are used.
	TTLOverrideMinutes int `yaml:"ttl-override-minutes,omitempty" json:"ttl-override-minutes,omitempty"`
}

// CORSConfig controls browser access to the API.
type CORSConfig struct {
	AllowedOrigins []string `yaml:"allowed-origins,omitempty" json:"allowed-origins,omitempty"`
}
