// Package jwt provides JWT token generation and validation for API session management.
// It supports JWT generation, validation, refresh tokens, and middleware integration.
package jwt

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/logging"
	log "github.com/sirupsen/logrus"
)

var (
	// ErrInvalidToken is returned when a token is invalid
	ErrInvalidToken = errors.New("invalid token")
	// ErrExpiredToken is returned when a token has expired
	ErrExpiredToken = errors.New("token expired")
	// ErrTokenMissing is returned when no token is provided
	ErrTokenMissing = errors.New("token missing")
)

// Manager manages JWT token generation and validation
type Manager struct {
	secretKey       []byte
	issuer          string
	accessDuration  time.Duration
	refreshDuration time.Duration
	mu              sync.RWMutex
	blacklist       map[string]time.Time
}

// Config holds JWT configuration
type Config struct {
	SecretKey        string
	Issuer           string
	AccessDuration   time.Duration
	RefreshDuration  time.Duration
	SigningAlgorithm string
}

// DefaultConfig returns sensible defaults for JWT configuration
func DefaultConfig() Config {
	// Generate a random secret if none provided
	secret := generateSecretKey()

	return Config{
		SecretKey:        secret,
		Issuer:           "cliproxy-api",
		AccessDuration:   time.Hour,
		RefreshDuration:  7 * 24 * time.Hour,
		SigningAlgorithm: "HS256",
	}
}

// NewManager creates a new JWT token manager
func NewManager(cfg Config) (*Manager, error) {
	if cfg.SecretKey == "" {
		cfg.SecretKey = generateSecretKey()
		log.Warn("Generated random JWT secret key - set JWT_SECRET in production")
	}

	if cfg.Issuer == "" {
		cfg.Issuer = "cliproxy-api"
	}

	if cfg.AccessDuration <= 0 {
		cfg.AccessDuration = time.Hour
	}

	if cfg.RefreshDuration <= 0 {
		cfg.RefreshDuration = 7 * 24 * time.Hour
	}

	return &Manager{
		secretKey:       []byte(cfg.SecretKey),
		issuer:          cfg.Issuer,
		accessDuration:  cfg.AccessDuration,
		refreshDuration: cfg.RefreshDuration,
		blacklist:       make(map[string]time.Time),
	}, nil
}

// NewManagerFromConfig creates a JWT manager from application config
func NewManagerFromConfig(cfg *config.Config) (*Manager, error) {
	jwtCfg := Config{
		SecretKey:        cfg.JWTSecret,
		Issuer:           "cliproxy-api",
		AccessDuration:   time.Hour,
		RefreshDuration:  7 * 24 * time.Hour,
		SigningAlgorithm: "HS256",
	}
	return NewManager(jwtCfg)
}

// generateSecretKey generates a random secret key
func generateSecretKey() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		// Fallback to a default key if random generation fails
		return "default-secret-key-change-in-production"
	}
	return base64.StdEncoding.EncodeToString(b)
}

// Claims represents JWT claims
type Claims struct {
	UserID    string                 `json:"user_id"`
	APIKey    string                 `json:"api_key,omitempty"`
	AuthID    string                 `json:"auth_id,omitempty"`
	Provider  string                 `json:"provider,omitempty"`
	Roles     []string               `json:"roles,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	TokenType string                 `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// GenerateAccessToken generates a new JWT access token
func (m *Manager) GenerateAccessToken(userID, apiKey string, additionalClaims map[string]interface{}) (string, error) {
	return m.generateToken(userID, apiKey, "access", m.accessDuration, additionalClaims)
}

// GenerateRefreshToken generates a new JWT refresh token
func (m *Manager) GenerateRefreshToken(userID, apiKey string, additionalClaims map[string]interface{}) (string, error) {
	return m.generateToken(userID, apiKey, "refresh", m.refreshDuration, additionalClaims)
}

// GenerateTokenPair generates both access and refresh tokens
func (m *Manager) GenerateTokenPair(userID, apiKey string, additionalClaims map[string]interface{}) (accessToken, refreshToken string, err error) {
	accessToken, err = m.GenerateAccessToken(userID, apiKey, additionalClaims)
	if err != nil {
		return "", "", fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err = m.GenerateRefreshToken(userID, apiKey, additionalClaims)
	if err != nil {
		return "", "", fmt.Errorf("generate refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

// generateToken generates a JWT token with the given parameters
func (m *Manager) generateToken(userID, apiKey, tokenType string, duration time.Duration, additionalClaims map[string]interface{}) (string, error) {
	now := time.Now()
	expiryTime := now.Add(duration)

	claims := Claims{
		UserID:    userID,
		APIKey:    apiKey,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    m.issuer,
			Subject:   userID,
			Audience:  []string{"cliproxy-api"},
			ExpiresAt: jwt.NewNumericDate(expiryTime),
			NotBefore: jwt.NewNumericDate(now),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	// Add additional claims
	if additionalClaims != nil {
		if authID, ok := additionalClaims["auth_id"].(string); ok {
			claims.AuthID = authID
		}
		if provider, ok := additionalClaims["provider"].(string); ok {
			claims.Provider = provider
		}
		if roles, ok := additionalClaims["roles"].([]string); ok {
			claims.Roles = roles
		}
		// Store any additional metadata
		claims.Metadata = make(map[string]interface{})
		for k, v := range additionalClaims {
			if k != "auth_id" && k != "provider" && k != "roles" {
				claims.Metadata[k] = v
			}
		}
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(m.secretKey)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken validates a JWT token and returns the claims
func (m *Manager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.secretKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// Check if token is blacklisted
	m.mu.RLock()
	if expiry, blacklisted := m.blacklist[tokenString]; blacklisted {
		m.mu.RUnlock()
		if time.Now().Before(expiry) {
			return nil, ErrInvalidToken
		}
	} else {
		m.mu.RUnlock()
	}

	// Verify issuer
	if claims.Issuer != m.issuer {
		return nil, ErrInvalidToken
	}

	// Verify token type
	if claims.TokenType != "access" && claims.TokenType != "refresh" {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// RefreshAccessToken generates a new access token from a valid refresh token
func (m *Manager) RefreshAccessToken(refreshToken string) (string, error) {
	claims, err := m.ValidateToken(refreshToken)
	if err != nil {
		return "", fmt.Errorf("validate refresh token: %w", err)
	}

	if claims.TokenType != "refresh" {
		return "", ErrInvalidToken
	}

	// Extract original claims
	additionalClaims := make(map[string]interface{})
	if claims.AuthID != "" {
		additionalClaims["auth_id"] = claims.AuthID
	}
	if claims.Provider != "" {
		additionalClaims["provider"] = claims.Provider
	}
	if len(claims.Roles) > 0 {
		additionalClaims["roles"] = claims.Roles
	}
	for k, v := range claims.Metadata {
		additionalClaims[k] = v
	}

	// Generate new access token
	return m.GenerateAccessToken(claims.UserID, claims.APIKey, additionalClaims)
}

// RevokeToken adds a token to the blacklist
func (m *Manager) RevokeToken(tokenString string) error {
	claims, err := m.ValidateToken(tokenString)
	if err != nil {
		return err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Blacklist until the token expires naturally
	m.blacklist[tokenString] = claims.ExpiresAt.Time

	log.WithFields(log.Fields{
		"user_id":    claims.UserID,
		"token_type": claims.TokenType,
		"expires_at": claims.ExpiresAt.Time,
	}).Info("Token revoked")

	return nil
}

// CleanExpiredTokens removes expired tokens from the blacklist
func (m *Manager) CleanExpiredTokens() {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	for token, expiry := range m.blacklist {
		if now.After(expiry) {
			delete(m.blacklist, token)
		}
	}
}

// GetTokenExpiration returns the expiration time of a token
func (m *Manager) GetTokenExpiration(tokenString string) (time.Time, error) {
	claims, err := m.ValidateToken(tokenString)
	if err != nil {
		return time.Time{}, err
	}
	return claims.ExpiresAt.Time, nil
}

// AuthMiddleware returns a Gin middleware for JWT authentication
func (m *Manager) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header or query parameter
		tokenString := m.extractToken(c)

		if tokenString == "" {
			c.AbortWithStatusJSON(401, gin.H{
				"error": "authentication required",
			})
			return
		}

		// Validate token
		claims, err := m.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{
				"error": fmt.Sprintf("invalid token: %v", err),
			})
			return
		}

		// Store claims in context
		c.Set("jwt_claims", claims)
		c.Set("user_id", claims.UserID)
		if claims.APIKey != "" {
			c.Set("api_key", claims.APIKey)
		}

		// Add request ID to logger
		if reqID := logging.GetGinRequestID(c); reqID != "" {
			c.Set("request_id", reqID)
		}

		c.Next()
	}
}

// extractToken extracts the JWT token from the request
func (m *Manager) extractToken(c *gin.Context) string {
	// Try Authorization header first
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		// Support both "Bearer <token>" and "JWT <token>"
		parts := []string{"Bearer ", "JWT "}
		for _, prefix := range parts {
			if len(authHeader) > len(prefix) && authHeader[:len(prefix)] == prefix {
				return authHeader[len(prefix):]
			}
		}
		// Try the whole header as the token
		return authHeader
	}

	// Try query parameter
	if token := c.Query("token"); token != "" {
		return token
	}

	// Try cookie
	if token, err := c.Cookie("jwt_token"); err == nil && token != "" {
		return token
	}

	return ""
}

// OptionalAuthMiddleware returns a middleware that validates JWT if present but doesn't require it
func (m *Manager) OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := m.extractToken(c)

		if tokenString != "" {
			if claims, err := m.ValidateToken(tokenString); err == nil {
				c.Set("jwt_claims", claims)
				c.Set("user_id", claims.UserID)
				if claims.APIKey != "" {
					c.Set("api_key", claims.APIKey)
				}
			}
		}

		c.Next()
	}
}

// GetClaimsFromContext extracts JWT claims from Gin context
func GetClaimsFromContext(c *gin.Context) (*Claims, bool) {
	claims, exists := c.Get("jwt_claims")
	if !exists {
		return nil, false
	}

	jwtClaims, ok := claims.(*Claims)
	return jwtClaims, ok
}

// MustGetClaimsFromContext extracts JWT claims or panics
func MustGetClaimsFromContext(c *gin.Context) *Claims {
	claims, _ := GetClaimsFromContext(c)
	return claims
}

// GenerateAPISessionToken creates a JWT token for API session management
func (m *Manager) GenerateAPISessionToken(apiKey string, authID, provider string) (string, error) {
	additionalClaims := map[string]interface{}{
		"auth_id":  authID,
		"provider": provider,
	}

	return m.GenerateAccessToken(apiKey, apiKey, additionalClaims)
}

// ValidateAPISessionToken validates an API session token
func (m *Manager) ValidateAPISessionToken(tokenString string) (apiKey, authID, provider string, err error) {
	claims, err := m.ValidateToken(tokenString)
	if err != nil {
		return "", "", "", err
	}

	return claims.APIKey, claims.AuthID, claims.Provider, nil
}

// GetUserIDFromToken extracts the user ID from a token
func (m *Manager) GetUserIDFromToken(tokenString string) (string, error) {
	claims, err := m.ValidateToken(tokenString)
	if err != nil {
		return "", err
	}
	return claims.UserID, nil
}

// IsTokenExpired checks if a token is expired without validating it
func (m *Manager) IsTokenExpired(tokenString string) bool {
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())
	_, _, err := parser.ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return true
	}
	return false
}

// TokenInfo provides information about a token
type TokenInfo struct {
	UserID      string    `json:"user_id"`
	APIKey      string    `json:"api_key,omitempty"`
	AuthID      string    `json:"auth_id,omitempty"`
	Provider    string    `json:"provider,omitempty"`
	TokenType   string    `json:"token_type"`
	IssuedAt    time.Time `json:"issued_at"`
	ExpiresAt   time.Time `json:"expires_at"`
	ExpiresIn   int64     `json:"expires_in"`
	IsExpired   bool      `json:"is_expired"`
}

// GetTokenInfo returns detailed information about a token
func (m *Manager) GetTokenInfo(tokenString string) (*TokenInfo, error) {
	claims, err := m.ValidateToken(tokenString)
	if err != nil {
		if errors.Is(err, ErrExpiredToken) {
			// Token is expired but we can still extract some info
			parser := jwt.NewParser()
			if token, _, parseErr := parser.ParseUnverified(tokenString, &Claims{}); parseErr == nil {
				if expiredClaims, ok := token.Claims.(*Claims); ok {
					return &TokenInfo{
						UserID:    expiredClaims.UserID,
						APIKey:    expiredClaims.APIKey,
						AuthID:    expiredClaims.AuthID,
						Provider:  expiredClaims.Provider,
						TokenType: expiredClaims.TokenType,
						IssuedAt:  expiredClaims.IssuedAt.Time,
						ExpiresAt: expiredClaims.ExpiresAt.Time,
						IsExpired: true,
					}, nil
				}
			}
		}
		return nil, err
	}

	expiresIn := int64(time.Until(claims.ExpiresAt.Time).Seconds())
	if expiresIn < 0 {
		expiresIn = 0
	}

	return &TokenInfo{
		UserID:    claims.UserID,
		APIKey:    claims.APIKey,
		AuthID:    claims.AuthID,
		Provider:  claims.Provider,
		TokenType: claims.TokenType,
		IssuedAt:  claims.IssuedAt.Time,
		ExpiresAt: claims.ExpiresAt.Time,
		ExpiresIn: expiresIn,
		IsExpired: false,
	}, nil
}

// UpdateSecretKey updates the secret key used for signing tokens
// This is useful for key rotation, but note that existing tokens signed with
// the old key will become invalid
func (m *Manager) UpdateSecretKey(newSecret string) error {
	if newSecret == "" {
		return errors.New("secret key cannot be empty")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	m.secretKey = []byte(newSecret)
	log.Info("JWT secret key updated")

	return nil
}
