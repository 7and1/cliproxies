// Package proxygrid provides integration with the Proxy Grid API service
// for fetching search results, social media data, and web content.
package proxygrid

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/api/modules"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	log "github.com/sirupsen/logrus"
)

const (
	// DefaultBaseURL is the default Proxy Grid API base URL
	DefaultBaseURL = "http://google.savedimage.com"
	// DefaultSecret is the default API secret
	DefaultSecret = "21ab30d5ec9e26c4e425b2c76320c296dbb7e6d2d51cad700892c7752ca005c0"
	// SecretHeader is the header name for the API secret
	SecretHeader = "x-grid-secret"
	// DefaultTimeout is the default HTTP timeout for API requests
	DefaultTimeout = 30 * time.Second
)

// Cache TTL durations for different service types
const (
	TTLYouTube       = 30 * 24 * time.Hour  // 30 days
	TTLYouTubeInfo   = 7 * 24 * time.Hour   // 7 days
	TTLYouTubeSerp   = 4 * time.Hour        // 4 hours
	TTLGoogle        = 4 * time.Hour        // 4 hours
	TTLBing          = 4 * time.Hour        // 4 hours
	TTLSimilarWeb    = 7 * 24 * time.Hour   // 7 days
	TTLWeb2MD        = 24 * time.Hour       // 24 hours
	TTLScreenshot    = 1 * time.Hour        // 1 hour
	TTLReddit        = 15 * time.Minute     // 15 minutes
	TTLTwitter       = 1 * time.Hour        // 1 hour
	TTLInstagram     = 24 * time.Hour       // 24 hours
	TTLTikTok        = 24 * time.Hour       // 24 hours
	TTLAmazon        = 24 * time.Hour       // 24 hours
	TTLHackerNews    = 15 * time.Minute     // 15 minutes
	TTLCrunchbase    = 7 * 24 * time.Hour   // 7 days
)

// cachedResponse represents a cached API response with metadata
type cachedResponse struct {
	Data      []byte    `json:"data"`
	TTL       time.Duration `json:"ttl"`
	CachedAt  time.Time `json:"cached_at"`
	Service   string    `json:"service"`
}

// Module is the Proxy Grid integration module
type Module struct {
	config    *config.ProxyGridConfig
	client    *http.Client
	cache     sync.Map
	enabled   bool
	mu        sync.RWMutex
}

// NewModule creates a new Proxy Grid module
func NewModule(cfg *config.ProxyGridConfig) *Module {
	m := &Module{
		config: cfg,
		client: &http.Client{
			Timeout: DefaultTimeout,
		},
		enabled: cfg != nil && cfg.Enabled,
	}

	// Start cache cleanup goroutine
	go m.cacheCleanup()

	return m
}

// Name returns the module name
func (m *Module) Name() string {
	return "proxygrid"
}

// Register registers the module's routes
func (m *Module) Register(ctx modules.Context) error {
	m.mu.Lock()
	m.enabled = m.config != nil && m.config.Enabled
	cfg := m.config
	m.mu.Unlock()

	if !m.enabled {
		log.Info("Proxy Grid module is disabled")
		return nil
	}

	if cfg == nil || cfg.BaseURL == "" || cfg.Secret == "" {
		log.Warn("Proxy Grid enabled but base-url or secret missing; disabling module")
		m.mu.Lock()
		m.enabled = false
		m.mu.Unlock()
		return nil
	}

	parsed, err := url.Parse(cfg.BaseURL)
	if err != nil || strings.ToLower(parsed.Scheme) != "https" {
		log.Warnf("Proxy Grid base-url must be https, got %s; disabling module", cfg.BaseURL)
		m.mu.Lock()
		m.enabled = false
		m.mu.Unlock()
		return nil
	}

	// Create API route group
	api := ctx.Engine.Group("/v1/proxygrid")

	// Apply authentication middleware if provided
	if ctx.AuthMiddleware != nil {
		api.Use(ctx.AuthMiddleware)
	}

	// Register service routes
	m.registerSearchRoutes(api)
	m.registerVideoRoutes(api)
	m.registerSocialRoutes(api)
	m.registerContentRoutes(api)
	m.registerCommerceRoutes(api)

	log.Info("Proxy Grid module registered successfully")
	return nil
}

// OnConfigUpdated handles configuration updates
func (m *Module) OnConfigUpdated(cfg *config.Config) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.config = &cfg.SDKConfig.ProxyGrid
	m.enabled = m.config != nil && m.config.Enabled

	if m.enabled {
		if m.config.BaseURL == "" || m.config.Secret == "" {
			log.Warn("Proxy Grid enabled but base-url or secret missing after config update; disabling module")
			m.enabled = false
		} else if parsed, err := url.Parse(m.config.BaseURL); err != nil || strings.ToLower(parsed.Scheme) != "https" {
			log.Warnf("Proxy Grid base-url must be https, got %s; disabling module", m.config.BaseURL)
			m.enabled = false
		}
	}

	// Update client timeout if config changed
	if m.config != nil && m.config.Timeout > 0 {
		m.client.Timeout = time.Duration(m.config.Timeout) * time.Second
	} else {
		m.client.Timeout = DefaultTimeout
	}

	return nil
}

// registerSearchRoutes registers search engine result page routes
func (m *Module) registerSearchRoutes(router *gin.RouterGroup) {
	search := router.Group("/search")
	{
		search.GET("/google", m.handleGoogleSearch)
		search.GET("/bing", m.handleBingSearch)
		search.GET("/youtube", m.handleYouTubeSerp)
	}
}

// registerVideoRoutes registers video-related routes
func (m *Module) registerVideoRoutes(router *gin.RouterGroup) {
	video := router.Group("/video")
	{
		video.GET("/youtube/:id", m.handleYouTubeVideo)
		video.GET("/youtube/:id/info", m.handleYouTubeInfo)
	}
}

// registerSocialRoutes registers social media routes
func (m *Module) registerSocialRoutes(router *gin.RouterGroup) {
	social := router.Group("/social")
	{
		social.GET("/twitter/:id", m.handleTwitter)
		social.GET("/instagram/:username", m.handleInstagram)
		social.GET("/tiktok/:username", m.handleTikTok)
		social.GET("/reddit", m.handleReddit)
	}
}

// registerContentRoutes registers web content routes
func (m *Module) registerContentRoutes(router *gin.RouterGroup) {
	content := router.Group("/content")
	{
		content.GET("/screenshot", m.handleScreenshot)
		content.GET("/markdown", m.handleWeb2MD)
		content.GET("/similarweb/:domain", m.handleSimilarWeb)
		content.GET("/hackernews", m.handleHackerNews)
	}
}

// registerCommerceRoutes registers e-commerce routes
func (m *Module) registerCommerceRoutes(router *gin.RouterGroup) {
	commerce := router.Group("/commerce")
	{
		commerce.GET("/amazon/:asin", m.handleAmazon)
		commerce.GET("/crunchbase/:slug", m.handleCrunchbase)
	}
}

// handleGoogleSearch handles Google search requests
func (m *Module) handleGoogleSearch(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(400, gin.H{"error": "Missing query parameter 'q'"})
		return
	}

	result, err := m.fetchWithCache("google", query, TTLGoogle, func() ([]byte, error) {
		return m.callAPI("google", query, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleBingSearch handles Bing search requests
func (m *Module) handleBingSearch(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(400, gin.H{"error": "Missing query parameter 'q'"})
		return
	}

	result, err := m.fetchWithCache("bing", query, TTLBing, func() ([]byte, error) {
		return m.callAPI("bing", query, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleYouTubeSerp handles YouTube search requests
func (m *Module) handleYouTubeSerp(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(400, gin.H{"error": "Missing query parameter 'q'"})
		return
	}

	result, err := m.fetchWithCache("youtube_serp", query, TTLYouTubeSerp, func() ([]byte, error) {
		return m.callAPI("youtube_serp", query, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleYouTubeVideo handles YouTube video transcript/caption requests
func (m *Module) handleYouTubeVideo(c *gin.Context) {
	videoID := c.Param("id")
	if videoID == "" {
		c.JSON(400, gin.H{"error": "Missing video ID"})
		return
	}

	result, err := m.fetchWithCache("youtube", videoID, TTLYouTube, func() ([]byte, error) {
		return m.callAPI("youtube", videoID, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleYouTubeInfo handles YouTube video info requests
func (m *Module) handleYouTubeInfo(c *gin.Context) {
	videoID := c.Param("id")
	if videoID == "" {
		c.JSON(400, gin.H{"error": "Missing video ID"})
		return
	}

	result, err := m.fetchWithCache("youtube_info", videoID, TTLYouTubeInfo, func() ([]byte, error) {
		return m.callAPI("youtube_info", videoID, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleTwitter handles Twitter/X tweet requests
func (m *Module) handleTwitter(c *gin.Context) {
	tweetID := c.Param("id")
	if tweetID == "" {
		c.JSON(400, gin.H{"error": "Missing tweet ID"})
		return
	}

	result, err := m.fetchWithCache("twitter", tweetID, TTLTwitter, func() ([]byte, error) {
		return m.callAPI("twitter", tweetID, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleInstagram handles Instagram user profile requests
func (m *Module) handleInstagram(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(400, gin.H{"error": "Missing username"})
		return
	}

	result, err := m.fetchWithCache("instagram", username, TTLInstagram, func() ([]byte, error) {
		return m.callAPI("instagram", username, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleTikTok handles TikTok user profile requests
func (m *Module) handleTikTok(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(400, gin.H{"error": "Missing username"})
		return
	}

	result, err := m.fetchWithCache("tiktok", username, TTLTikTok, func() ([]byte, error) {
		return m.callAPI("tiktok", username, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleReddit handles Reddit post requests
func (m *Module) handleReddit(c *gin.Context) {
	postURL := c.Query("url")
	if postURL == "" {
		c.JSON(400, gin.H{"error": "Missing url parameter"})
		return
	}

	result, err := m.fetchWithCache("reddit", postURL, TTLReddit, func() ([]byte, error) {
		return m.callAPI("reddit", postURL, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleScreenshot handles screenshot requests
func (m *Module) handleScreenshot(c *gin.Context) {
	targetURL := c.Query("url")
	if targetURL == "" {
		c.JSON(400, gin.H{"error": "Missing url parameter"})
		return
	}

	result, err := m.fetchWithCache("screenshot", targetURL, TTLScreenshot, func() ([]byte, error) {
		return m.callAPI("screenshot", targetURL, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	// Screenshot returns an image
	c.Data(200, "image/png", result)
}

// handleWeb2MD handles web-to-markdown conversion requests
func (m *Module) handleWeb2MD(c *gin.Context) {
	targetURL := c.Query("url")
	if targetURL == "" {
		c.JSON(400, gin.H{"error": "Missing url parameter"})
		return
	}

	result, err := m.fetchWithCache("web2md", targetURL, TTLWeb2MD, func() ([]byte, error) {
		return m.callAPI("web2md", targetURL, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	// Return as markdown
	c.Data(200, "text/markdown; charset=utf-8", result)
}

// handleSimilarWeb handles SimilarWeb domain analytics requests
func (m *Module) handleSimilarWeb(c *gin.Context) {
	domain := c.Param("domain")
	if domain == "" {
		c.JSON(400, gin.H{"error": "Missing domain"})
		return
	}

	result, err := m.fetchWithCache("similarweb", domain, TTLSimilarWeb, func() ([]byte, error) {
		return m.callAPI("similarweb", domain, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleHackerNews handles HackerNews stories requests
func (m *Module) handleHackerNews(c *gin.Context) {
	storyType := c.DefaultQuery("type", "top")
	if storyType == "" {
		storyType = "top"
	}

	result, err := m.fetchWithCache("hackernews", storyType, TTLHackerNews, func() ([]byte, error) {
		return m.callAPI("hackernews", storyType, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleAmazon handles Amazon product requests
func (m *Module) handleAmazon(c *gin.Context) {
	asin := c.Param("asin")
	if asin == "" {
		c.JSON(400, gin.H{"error": "Missing ASIN"})
		return
	}

	result, err := m.fetchWithCache("amazon", asin, TTLAmazon, func() ([]byte, error) {
		return m.callAPI("amazon", asin, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// handleCrunchbase handles Crunchbase organization requests
func (m *Module) handleCrunchbase(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(400, gin.H{"error": "Missing organization slug"})
		return
	}

	result, err := m.fetchWithCache("crunchbase", slug, TTLCrunchbase, func() ([]byte, error) {
		return m.callAPI("crunchbase", slug, "")
	})

	if err != nil {
		m.handleError(c, err)
		return
	}

	c.Data(200, "application/json", result)
}

// callAPI makes a request to the Proxy Grid API
func (m *Module) callAPI(service, input, extra string) ([]byte, error) {
	baseURL := DefaultBaseURL
	secret := DefaultSecret

	if m.config != nil {
		if m.config.BaseURL != "" {
			baseURL = m.config.BaseURL
		}
		if m.config.Secret != "" {
			secret = m.config.Secret
		}
	}

	// Build the request URL based on service type
	var reqURL string
	switch service {
	case "google":
		reqURL = fmt.Sprintf("%s/api/google?keyword=%s", baseURL, url.QueryEscape(input))
	case "bing":
		reqURL = fmt.Sprintf("%s/api/bing?keyword=%s", baseURL, url.QueryEscape(input))
	case "youtube":
		reqURL = fmt.Sprintf("%s/api/youtube?video=%s", baseURL, url.QueryEscape(input))
	case "youtube_info":
		reqURL = fmt.Sprintf("%s/api/youtube_info?video=%s", baseURL, url.QueryEscape(input))
	case "youtube_serp":
		reqURL = fmt.Sprintf("%s/api/youtube_serp?keyword=%s", baseURL, url.QueryEscape(input))
	case "similarweb":
		reqURL = fmt.Sprintf("%s/api/similarweb?domain=%s", baseURL, url.QueryEscape(input))
	case "web2md":
		reqURL = fmt.Sprintf("%s/api/web2md?url=%s", baseURL, url.QueryEscape(input))
	case "screenshot":
		reqURL = fmt.Sprintf("%s/api/screenshot?url=%s", baseURL, url.QueryEscape(input))
	case "hackernews":
		reqURL = fmt.Sprintf("%s/api/hackernews?type=%s", baseURL, url.QueryEscape(input))
	case "reddit":
		reqURL = fmt.Sprintf("%s/api/reddit?url=%s", baseURL, url.QueryEscape(input))
	case "twitter":
		reqURL = fmt.Sprintf("%s/api/twitter?url=%s", baseURL, url.QueryEscape(input))
	case "instagram":
		reqURL = fmt.Sprintf("%s/api/instagram?username=%s", baseURL, url.QueryEscape(input))
	case "tiktok":
		reqURL = fmt.Sprintf("%s/api/tiktok?username=%s", baseURL, url.QueryEscape(input))
	case "amazon":
		reqURL = fmt.Sprintf("%s/api/amazon?asin=%s", baseURL, url.QueryEscape(input))
	case "crunchbase":
		reqURL = fmt.Sprintf("%s/api/crunchbase?slug=%s", baseURL, url.QueryEscape(input))
	default:
		return nil, fmt.Errorf("unknown service: %s", service)
	}

	// Create the request
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set(SecretHeader, secret)
	req.Header.Set("User-Agent", "CLIProxyAPI/1.0")
	req.Header.Set("Accept", "application/json")

	// Execute the request
	resp, err := m.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Read response body
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	return data, nil
}

// cacheKey generates a cache key for a service and input
func (m *Module) cacheKey(service, input string) string {
	h := sha256.New()
	h.Write([]byte(service + ":" + input))
	return "proxygrid:" + hex.EncodeToString(h.Sum(nil))
}

// fetchWithCache fetches data from cache or API
func (m *Module) fetchWithCache(service, input string, ttl time.Duration, fetchFn func() ([]byte, error)) ([]byte, error) {
	key := m.cacheKey(service, input)

	// Try to get from cache
	if val, ok := m.cache.Load(key); ok {
		cached := val.(*cachedResponse)
		if time.Since(cached.CachedAt) < cached.TTL {
			log.Debugf("Proxy Grid cache hit for %s:%s", service, input)
			return cached.Data, nil
		}
		// Remove expired entry
		m.cache.Delete(key)
	}

	log.Debugf("Proxy Grid cache miss for %s:%s, fetching from API", service, input)

	// Fetch from API
	data, err := fetchFn()
	if err != nil {
		// Return stale cache if available
		if val, ok := m.cache.Load(key); ok {
			cached := val.(*cachedResponse)
			log.Warnf("Proxy Grid API error for %s:%s, returning stale cache: %v", service, input, err)
			return cached.Data, nil
		}
		return nil, err
	}

	// Store in cache
	cached := &cachedResponse{
		Data:     data,
		TTL:      ttl,
		CachedAt: time.Now(),
		Service:  service,
	}
	m.cache.Store(key, cached)

	return data, nil
}

// cacheCleanup periodically removes expired cache entries
func (m *Module) cacheCleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		m.cache.Range(func(key, value any) bool {
			cached := value.(*cachedResponse)
			if now.Sub(cached.CachedAt) > cached.TTL {
				m.cache.Delete(key)
			}
			return true
		})
	}
}

// handleError handles errors and returns appropriate JSON responses
func (m *Module) handleError(c *gin.Context, err error) {
	log.Errorf("Proxy Grid error: %v", err)

	if strings.Contains(err.Error(), "rate limit") {
		c.JSON(429, gin.H{
			"error": "Rate limit exceeded",
			"retry_after": 60,
		})
		return
	}

	c.JSON(500, gin.H{
		"error": err.Error(),
	})
}

// GetCacheStats returns cache statistics
func (m *Module) GetCacheStats() map[string]interface{} {
	stats := make(map[string]interface{})
	var totalEntries, expiredEntries int
	now := time.Now()

	serviceCount := make(map[string]int)

	m.cache.Range(func(_, value any) bool {
		cached := value.(*cachedResponse)
		totalEntries++
		serviceCount[cached.Service]++
		if now.Sub(cached.CachedAt) > cached.TTL {
			expiredEntries++
		}
		return true
	})

	stats["total_entries"] = totalEntries
	stats["expired_entries"] = expiredEntries
	stats["active_entries"] = totalEntries - expiredEntries
	stats["service_distribution"] = serviceCount

	return stats
}

// ClearCache clears the cache for a specific service or all services
func (m *Module) ClearCache(service string) int {
	var count int

	if service == "" || service == "*" {
		// Clear all
		m.cache.Range(func(key, _ any) bool {
			m.cache.Delete(key)
			count++
			return true
		})
	} else {
		// Clear specific service
		m.cache.Range(func(key, value any) bool {
			if cached, ok := value.(*cachedResponse); ok && cached.Service == service {
				m.cache.Delete(key)
				count++
			}
			return true
		})
	}

	return count
}

// IsEnabled returns whether the module is enabled
func (m *Module) IsEnabled() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.enabled
}
