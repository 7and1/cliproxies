package proxygrid

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"testing"
	"time"

	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
)

// TestModuleCreation tests the creation of a new Proxy Grid module
func TestModuleCreation(t *testing.T) {
	tests := []struct {
		name    string
		config  *config.ProxyGridConfig
		wantErr bool
	}{
		{
			name: "nil config",
			config: nil,
			wantErr: false,
		},
		{
			name: "disabled config",
			config: &config.ProxyGridConfig{
				Enabled: false,
			},
			wantErr: false,
		},
		{
			name: "enabled config with defaults",
			config: &config.ProxyGridConfig{
				Enabled: true,
			},
			wantErr: false,
		},
		{
			name: "enabled config with custom settings",
			config: &config.ProxyGridConfig{
				Enabled: true,
				BaseURL: "http://custom.example.com",
				Secret:  "test-secret",
				Timeout: 60,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := NewModule(tt.config)
			if m == nil {
				t.Fatal("NewModule returned nil")
			}

			if m.Name() != "proxygrid" {
				t.Errorf("Name() = %v, want %v", m.Name(), "proxygrid")
			}

			wantEnabled := tt.config != nil && tt.config.Enabled
			if got := m.IsEnabled(); got != wantEnabled {
				t.Errorf("IsEnabled() = %v, want %v", got, wantEnabled)
			}
		})
	}
}

// TestCacheKeyGeneration tests the cache key generation
func TestCacheKeyGeneration(t *testing.T) {
	// Test the helper function that replicates cacheKey logic
	tests := []struct {
		name          string
		service       string
		input        string
		minLen       int
	}{
		{
			name:    "google search",
			service: "google",
			input:   "test query",
			minLen:  len("proxygrid:") + 10, // At least prefix + some hash
		},
		{
			name:    "youtube video",
			service: "youtube",
			input:   "dQw4w9WgXcQ",
			minLen: len("proxygrid:") + 10,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			key := buildTestCacheKey(tt.service, tt.input)
			if len(key) < tt.minLen {
				t.Errorf("cacheKey() length = %v, want at least %v", len(key), tt.minLen)
			}
			if !strings.HasPrefix(key, "proxygrid:") {
				t.Errorf("cacheKey() prefix = %v, want to start with %v", key[:10], "proxygrid:")
			}
		})
	}
}

func buildTestCacheKey(service, input string) string {
	h := sha256.New()
	h.Write([]byte(service + ":" + input))
	return "proxygrid:" + hex.EncodeToString(h.Sum(nil))
}

// TestCacheTTLConstants tests that cache TTL constants are properly defined
func TestCacheTTLConstants(t *testing.T) {
	tests := []struct {
		name     string
		ttl      time.Duration
		min      time.Duration
		max      time.Duration
	}{
		{"YouTube", TTLYouTube, 29 * 24 * time.Hour, 31 * 24 * time.Hour},
		{"YouTubeInfo", TTLYouTubeInfo, 6 * 24 * time.Hour, 8 * 24 * time.Hour},
		{"YouTubeSerp", TTLYouTubeSerp, 3 * time.Hour, 5 * time.Hour},
		{"Google", TTLGoogle, 3 * time.Hour, 5 * time.Hour},
		{"Screenshot", TTLScreenshot, 30 * time.Minute, 90 * time.Minute},
		{"HackerNews", TTLHackerNews, 10 * time.Minute, 20 * time.Minute},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.ttl < tt.min || tt.ttl > tt.max {
				t.Errorf("%s TTL = %v, want between %v and %v", tt.name, tt.ttl, tt.min, tt.max)
			}
		})
	}
}

// TestGetCacheStats tests the cache statistics function
func TestGetCacheStats(t *testing.T) {
	m := NewModule(&config.ProxyGridConfig{Enabled: false})

	stats := m.GetCacheStats()
	if stats == nil {
		t.Fatal("GetCacheStats() returned nil")
	}

	// Check for expected keys
	expectedKeys := []string{"total_entries", "expired_entries", "active_entries", "service_distribution"}
	for _, key := range expectedKeys {
		if _, ok := stats[key]; !ok {
			t.Errorf("GetCacheStats() missing key %v", key)
		}
	}
}

// TestClearCache tests the cache clearing function
func TestClearCache(t *testing.T) {
	m := NewModule(&config.ProxyGridConfig{Enabled: false})

	// Clear all should work without error
	count := m.ClearCache("")
	if count < 0 {
		t.Errorf("ClearCache() returned negative count %v", count)
	}

	// Clear with wildcard
	count = m.ClearCache("*")
	if count < 0 {
		t.Errorf("ClearCache(*) returned negative count %v", count)
	}

	// Clear specific service
	count = m.ClearCache("google")
	if count < 0 {
		t.Errorf("ClearCache(google) returned negative count %v", count)
	}
}

// TestDefaultConstants tests that default constants are properly set
func TestDefaultConstants(t *testing.T) {
	if DefaultBaseURL == "" {
		t.Error("DefaultBaseURL is empty")
	}
	if DefaultSecret == "" {
		t.Error("DefaultSecret is empty")
	}
	if DefaultTimeout == 0 {
		t.Error("DefaultTimeout is zero")
	}
	if SecretHeader == "" {
		t.Error("SecretHeader is empty")
	}
}
