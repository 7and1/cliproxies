// Package middleware tests for JWT authentication middleware
package middleware

import (
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTConfig holds configuration for JWT middleware
type JWTConfig struct {
	Secret          string
	SigningMethod   string
	TokenHeader     string
	SkipPaths       []string
	RequiredClaims  map[string]string
}

// DefaultJWTConfig returns sensible defaults for JWT authentication
func DefaultJWTConfig() JWTConfig {
	return JWTConfig{
		Secret:        "test-secret-key-change-in-production",
		SigningMethod: "HS256",
		TokenHeader:   "Authorization",
		SkipPaths:     []string{"/health", "/ready", "/"},
	}
}

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	UserID   string                 `json:"user_id"`
	Email    string                 `json:"email,omitempty"`
	Role     string                 `json:"role,omitempty"`
	Provider string                 `json:"provider,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
	jwt.RegisteredClaims
}

// JWTMiddleware provides JWT authentication middleware
type JWTMiddleware struct {
	config JWTConfig
}

// NewJWTMiddleware creates a new JWT middleware instance
func NewJWTMiddleware(config JWTConfig) *JWTMiddleware {
	if config.Secret == "" {
		config.Secret = "default-secret-change-me"
	}
	if config.SigningMethod == "" {
		config.SigningMethod = "HS256"
	}
	if config.TokenHeader == "" {
		config.TokenHeader = "Authorization"
	}

	return &JWTMiddleware{
		config: config,
	}
}

// GenerateToken creates a new JWT token for a user
func (j *JWTMiddleware) GenerateToken(claims JWTClaims) (string, error) {
	if claims.RegisteredClaims.ExpiresAt == nil {
		claims.RegisteredClaims.ExpiresAt = jwt.NewNumericDate(time.Now().Add(24 * time.Hour))
	}
	if claims.RegisteredClaims.IssuedAt == nil {
		claims.RegisteredClaims.IssuedAt = jwt.NewNumericDate(time.Now())
	}
	if claims.RegisteredClaims.NotBefore == nil {
		claims.RegisteredClaims.NotBefore = jwt.NewNumericDate(time.Now())
	}

	token := jwt.NewWithClaims(jwt.GetSigningMethod(j.config.SigningMethod), claims)
	return token.SignedString([]byte(j.config.Secret))
}

// ValidateToken validates a JWT token and returns the claims
func (j *JWTMiddleware) ValidateToken(tokenString string) (*JWTClaims, error) {
	// Remove "Bearer " prefix if present
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")

	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if token.Method.Alg() != j.config.SigningMethod {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(j.config.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrInvalidKey
}

// Middleware returns a Gin middleware function for JWT authentication
func (j *JWTMiddleware) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if path should be skipped
		if j.shouldSkipPath(c.Request.URL.Path) {
			c.Next()
			return
		}

		// Extract token from header
		authHeader := c.GetHeader(j.config.TokenHeader)
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "missing authorization header",
			})
			return
		}

		// Validate token
		claims, err := j.ValidateToken(authHeader)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired token",
			})
			return
		}

		// Check required claims
		for key, value := range j.config.RequiredClaims {
			if !j.hasClaim(claims, key, value) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "missing required claim",
				})
				return
			}
		}

		// Set claims in context
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("claims", claims)

		c.Next()
	}
}

// shouldSkipPath checks if a path should skip authentication
func (j *JWTMiddleware) shouldSkipPath(path string) bool {
	for _, skipPath := range j.config.SkipPaths {
		if strings.HasPrefix(path, skipPath) {
			return true
		}
	}
	return false
}

// hasClaim checks if the claims contain a specific key-value pair
func (j *JWTMiddleware) hasClaim(claims *JWTClaims, key, value string) bool {
	switch key {
	case "role":
		return claims.Role == value
	case "provider":
		return claims.Provider == value
	case "email":
		return claims.Email == value
	}
	return false
}

// Table-driven tests for JWT middleware

func TestJWTMiddleware_GenerateToken(t *testing.T) {
	tests := []struct {
		name    string
		claims  JWTClaims
		wantErr bool
	}{
		{
			name: "valid token with all claims",
			claims: JWTClaims{
				UserID:  "user123",
				Email:   "test@example.com",
				Role:    "user",
				Provider: "github",
				RegisteredClaims: jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
					IssuedAt:  jwt.NewNumericDate(time.Now()),
				},
			},
			wantErr: false,
		},
		{
			name: "token with default expiry",
			claims: JWTClaims{
				UserID: "user456",
			},
			wantErr: false,
		},
		{
			name: "token with metadata",
			claims: JWTClaims{
				UserID: "user789",
				Metadata: map[string]interface{}{
					"plan":     "premium",
					"quota":    1000,
					"features": []string{"api", "webhook"},
				},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			j := NewJWTMiddleware(DefaultJWTConfig())
			token, err := j.GenerateToken(tt.claims)

			if (err != nil) != tt.wantErr {
				t.Errorf("GenerateToken() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && token == "" {
				t.Error("GenerateToken() returned empty token")
			}

			// Verify token can be parsed
			if !tt.wantErr && token != "" {
				claims, err := j.ValidateToken(token)
				if err != nil {
					t.Errorf("Generated token is invalid: %v", err)
				}
				if claims.UserID != tt.claims.UserID {
					t.Errorf("UserID mismatch: got %v, want %v", claims.UserID, tt.claims.UserID)
				}
			}
		})
	}
}

func TestJWTMiddleware_ValidateToken(t *testing.T) {
	j := NewJWTMiddleware(DefaultJWTConfig())

	claims := JWTClaims{
		UserID:  "user123",
		Email:   "test@example.com",
		Role:    "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := j.GenerateToken(claims)
	if err != nil {
		t.Fatalf("Failed to generate test token: %v", err)
	}

	tests := []struct {
		name      string
		token     string
		wantErr   bool
		wantID    string
		wantEmail string
	}{
		{
			name:      "valid token",
			token:     token,
			wantErr:   false,
			wantID:    "user123",
			wantEmail: "test@example.com",
		},
		{
			name:    "invalid token",
			token:   "invalid.token.here",
			wantErr: true,
		},
		{
			name:    "empty token",
			token:   "",
			wantErr: true,
		},
		{
			name:    "malformed token",
			token:   "Bearer not.a.valid.jwt",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			validatedClaims, err := j.ValidateToken(tt.token)

			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateToken() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if validatedClaims.UserID != tt.wantID {
					t.Errorf("UserID = %v, want %v", validatedClaims.UserID, tt.wantID)
				}
				if validatedClaims.Email != tt.wantEmail {
					t.Errorf("Email = %v, want %v", validatedClaims.Email, tt.wantEmail)
				}
			}
		})
	}
}

func TestJWTMiddleware_ValidateExpiredToken(t *testing.T) {
	j := NewJWTMiddleware(DefaultJWTConfig())

	// Create an expired token
	claims := JWTClaims{
		UserID: "user123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}

	token, err := j.GenerateToken(claims)
	if err != nil {
		t.Fatalf("Failed to generate expired token: %v", err)
	}

	_, err = j.ValidateToken(token)
	if err == nil {
		t.Error("ValidateToken() should return error for expired token")
	}
}

func TestJWTMiddleware_Middleware_Authentication(t *testing.T) {
	gin.SetMode(gin.TestMode)
	j := NewJWTMiddleware(DefaultJWTConfig())

	router := gin.New()
	router.Use(j.Middleware())
	router.GET("/protected", func(c *gin.Context) {
		userID := c.GetString("user_id")
		c.JSON(http.StatusOK, gin.H{"user_id": userID})
	})
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	tests := []struct {
		name         string
		path         string
		token        string
		wantStatus   int
		wantContains string
	}{
		{
			name:         "valid token on protected route",
			path:         "/protected",
			token:        generateTestToken(t, j),
			wantStatus:   http.StatusOK,
			wantContains: "user123",
		},
		{
			name:       "missing token on protected route",
			path:       "/protected",
			token:      "",
			wantStatus: http.StatusUnauthorized,
			wantContains: "missing authorization",
		},
		{
			name:       "invalid token on protected route",
			path:       "/protected",
			token:      "invalid-token",
			wantStatus: http.StatusUnauthorized,
			wantContains: "invalid or expired",
		},
		{
			name:         "no token required on health route",
			path:         "/health",
			token:        "",
			wantStatus:   http.StatusOK,
			wantContains: "ok",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", tt.path, nil)
			if tt.token != "" {
				req.Header.Set("Authorization", "Bearer "+tt.token)
			}
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d", w.Code, tt.wantStatus)
			}

			body := w.Body.String()
			if !strings.Contains(body, tt.wantContains) {
				t.Errorf("Response body should contain %q, got %q", tt.wantContains, body)
			}
		})
	}
}

func TestJWTMiddleware_Middleware_RequiredClaims(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config := DefaultJWTConfig()
	config.RequiredClaims = map[string]string{"role": "admin"}
	j := NewJWTMiddleware(config)

	router := gin.New()
	router.Use(j.Middleware())
	router.GET("/admin", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "admin access"})
	})

	tests := []struct {
		name       string
		role       string
		wantStatus int
	}{
		{
			name:       "user with admin role",
			role:       "admin",
			wantStatus: http.StatusOK,
		},
		{
			name:       "user without admin role",
			role:       "user",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "user with no role",
			role:       "",
			wantStatus: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims := JWTClaims{
				UserID: "user123",
				Role:   tt.role,
				RegisteredClaims: jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
				},
			}
			token, _ := j.GenerateToken(claims)

			req := httptest.NewRequest("GET", "/admin", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d", w.Code, tt.wantStatus)
			}
		})
	}
}

func TestJWTMiddleware_DifferentSigningMethods(t *testing.T) {
	tests := []struct {
		name         string
		signingMethod string
		wantErr      bool
	}{
		{"HS256", "HS256", false},
		{"HS384", "HS384", false},
		{"HS512", "HS512", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := DefaultJWTConfig()
			config.SigningMethod = tt.signingMethod
			j := NewJWTMiddleware(config)

			claims := JWTClaims{
				UserID: "user123",
				RegisteredClaims: jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
				},
			}

			token, err := j.GenerateToken(claims)
			if (err != nil) != tt.wantErr {
				t.Errorf("GenerateToken() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr {
				validatedClaims, err := j.ValidateToken(token)
				if err != nil {
					t.Errorf("ValidateToken() error = %v", err)
				}
				if validatedClaims.UserID != claims.UserID {
					t.Errorf("UserID = %v, want %v", validatedClaims.UserID, claims.UserID)
				}
			}
		})
	}
}

func TestJWTMiddleware_InvalidSignature(t *testing.T) {
	config1 := DefaultJWTConfig()
	config1.Secret = "secret1"
	j1 := NewJWTMiddleware(config1)

	config2 := DefaultJWTConfig()
	config2.Secret = "secret2"
	j2 := NewJWTMiddleware(config2)

	claims := JWTClaims{
		UserID: "user123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}

	token, _ := j1.GenerateToken(claims)

	// Try to validate with different secret
	_, err := j2.ValidateToken(token)
	if err == nil {
		t.Error("ValidateToken() should return error for invalid signature")
	}
}

func TestJWTMiddleware_BearerPrefixHandling(t *testing.T) {
	j := NewJWTMiddleware(DefaultJWTConfig())

	claims := JWTClaims{
		UserID: "user123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}

	token, _ := j.GenerateToken(claims)

	tests := []struct {
		name    string
		header  string
		wantErr bool
	}{
		{
			name:    "with Bearer prefix",
			header:  "Bearer " + token,
			wantErr: false,
		},
		{
			name:    "without Bearer prefix",
			header:  token,
			wantErr: false,
		},
		{
			name:    "lowercase bearer",
			header:  "bearer " + token,
			wantErr: false,
		},
		{
			name:    "mixed case bearer",
			header:  "BeArEr " + token,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := j.ValidateToken(tt.header)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateToken() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestJWTMiddleware_TokenParts(t *testing.T) {
	j := NewJWTMiddleware(DefaultJWTConfig())

	token, err := j.GenerateToken(JWTClaims{
		UserID: "user123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	})
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		t.Errorf("Token should have 3 parts, got %d", len(parts))
	}

	// Verify each part is valid base64
	for i, part := range parts {
		_, err := base64.RawURLEncoding.DecodeString(part)
		if err != nil {
			t.Errorf("Token part %d is not valid base64: %v", i, err)
		}
	}
}

func TestJWTMiddleware_MetadataClaims(t *testing.T) {
	j := NewJWTMiddleware(DefaultJWTConfig())

	metadata := map[string]interface{}{
		"plan":     "premium",
		"quota":    1000,
		"active":   true,
		"features": []string{"api", "webhook"},
	}

	claims := JWTClaims{
		UserID:   "user123",
		Metadata: metadata,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}

	token, err := j.GenerateToken(claims)
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	validatedClaims, err := j.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken() error = %v", err)
	}

	if validatedClaims.Metadata["plan"] != "premium" {
		t.Errorf("Metadata plan = %v, want premium", validatedClaims.Metadata["plan"])
	}

	if validatedClaims.Metadata["quota"].(float64) != 1000 {
		t.Errorf("Metadata quota = %v, want 1000", validatedClaims.Metadata["quota"])
	}
}

// Helper function to generate a test token
func generateTestToken(t *testing.T, j *JWTMiddleware) string {
	t.Helper()
	claims := JWTClaims{
		UserID: "user123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}
	token, err := j.GenerateToken(claims)
	if err != nil {
		t.Fatalf("Failed to generate test token: %v", err)
	}
	return token
}
