// Package security provides secrets management and validation functionality.
// This includes secrets validation, rotation, and encryption at rest.
package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/pbkdf2"
)

var (
	ErrInvalidSecret      = errors.New("invalid secret format")
	ErrSecretTooShort     = errors.New("secret is too short")
	ErrSecretTooLong      = errors.New("secret is too long")
	ErrSecretContainsSpaces = errors.New("secret contains whitespace")
	ErrMissingSecret      = errors.New("required secret is not set")
	ErrEncryptionFailed   = errors.New("encryption failed")
	ErrDecryptionFailed   = errors.New("decryption failed")
	ErrInvalidKeyFormat   = errors.New("invalid encryption key format")
)

// SecretValidator validates secrets according to security policies
type SecretValidator struct {
	minLength int
	maxLength int
	allowSpaces bool
	requireComplex bool
}

// NewSecretValidator creates a new secret validator with default policies
func NewSecretValidator() *SecretValidator {
	return &SecretValidator{
		minLength:      16,
		maxLength:      256,
		allowSpaces:    false,
		requireComplex: false,
	}
}

// SetMinLength sets the minimum secret length
func (v *SecretValidator) SetMinLength(min int) *SecretValidator {
	v.minLength = min
	return v
}

// SetMaxLength sets the maximum secret length
func (v *SecretValidator) SetMaxLength(max int) *SecretValidator {
	v.maxLength = max
	return v
}

// AllowSpaces allows or disallows spaces in secrets
func (v *SecretValidator) AllowSpaces(allow bool) *SecretValidator {
	v.allowSpaces = allow
	return v
}

// RequireComplexity requires complex secrets (mixed case, numbers, special chars)
func (v *SecretValidator) RequireComplexity(require bool) *SecretValidator {
	v.requireComplex = require
	return v
}

// Validate validates a secret according to the configured policies
func (v *SecretValidator) Validate(secret string) error {
	if secret == "" {
		return ErrMissingSecret
	}

	if len(secret) < v.minLength {
		return fmt.Errorf("%w: minimum %d characters required", ErrSecretTooShort, v.minLength)
	}

	if len(secret) > v.maxLength {
		return fmt.Errorf("%w: maximum %d characters allowed", ErrSecretTooLong, v.maxLength)
	}

	if !v.allowSpaces && containsWhitespace(secret) {
		return ErrSecretContainsSpaces
	}

	if v.requireComplex {
		if !isComplex(secret) {
			return fmt.Errorf("%w: secret must contain uppercase, lowercase, numbers, and special characters", ErrInvalidSecret)
		}
	}

	return nil
}

// ValidateAPIKey validates an API key format
func (v *SecretValidator) ValidateAPIKey(key string) error {
	if key == "" {
		return ErrMissingSecret
	}

	// Basic API key validation
	if len(key) < 10 {
		return fmt.Errorf("%w: API key too short", ErrSecretTooShort)
	}

	if len(key) > 512 {
		return fmt.Errorf("%w: API key too long", ErrSecretTooLong)
	}

	if containsWhitespace(key) {
		return ErrSecretContainsSpaces
	}

	return nil
}

// SecretsConfig holds secrets configuration for validation
type SecretsConfig struct {
	ManagementPassword string
	DatabasePassword   string
	APIKeys           []string
	OAuthClientSecret string
	EncryptionKey     string
}

// ValidateSecrets validates all configured secrets
func (v *SecretValidator) ValidateSecrets(config *SecretsConfig) []error {
	var errs []error

	if config.ManagementPassword != "" {
		if err := v.Validate(config.ManagementPassword); err != nil {
			errs = append(errs, fmt.Errorf("management password: %w", err))
		}
	}

	if config.DatabasePassword != "" {
		if err := v.Validate(config.DatabasePassword); err != nil {
			errs = append(errs, fmt.Errorf("database password: %w", err))
		}
	}

	if config.OAuthClientSecret != "" {
		if err := v.Validate(config.OAuthClientSecret); err != nil {
			errs = append(errs, fmt.Errorf("OAuth client secret: %w", err))
		}
	}

	for i, key := range config.APIKeys {
		if err := v.ValidateAPIKey(key); err != nil {
			errs = append(errs, fmt.Errorf("API key %d: %w", i, err))
		}
	}

	if config.EncryptionKey != "" {
		if err := v.ValidateEncryptionKey(config.EncryptionKey); err != nil {
			errs = append(errs, fmt.Errorf("encryption key: %w", err))
		}
	}

	return errs
}

// ValidateEncryptionKey validates an encryption key (should be base64-encoded 32 bytes for AES-256)
func (v *SecretValidator) ValidateEncryptionKey(key string) error {
	if key == "" {
		return ErrMissingSecret
	}

	// Check if it's a valid base64 string
	decoded, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		return fmt.Errorf("%w: encryption key must be valid base64", ErrInvalidKeyFormat)
	}

	// For AES-256, we need 32 bytes
	if len(decoded) != 32 {
		return fmt.Errorf("%w: encryption key must decode to 32 bytes for AES-256", ErrInvalidKeyFormat)
	}

	return nil
}

// GenerateEncryptionKey generates a new random encryption key
func GenerateEncryptionKey() (string, error) {
	key := make([]byte, 32) // 256 bits for AES-256
	if _, err := rand.Read(key); err != nil {
		return "", fmt.Errorf("failed to generate encryption key: %w", err)
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

// DeriveKey derives an encryption key from a password using PBKDF2
func DeriveKey(password, salt []byte, iterations int) ([]byte, error) {
	if iterations < 100000 {
		iterations = 100000 // OWASP recommendation
	}

	return pbkdf2.Key(password, salt, iterations, 32, sha256.New), nil
}

// Encryptor provides encryption/decryption for secrets at rest
type Encryptor struct {
	key []byte
}

// NewEncryptor creates a new encryptor with the provided key
func NewEncryptor(key string) (*Encryptor, error) {
	decoded, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidKeyFormat, err)
	}

	if len(decoded) != 32 {
		return nil, fmt.Errorf("%w: key must be 32 bytes for AES-256", ErrInvalidKeyFormat)
	}

	return &Encryptor{key: decoded}, nil
}

// Encrypt encrypts plaintext using AES-256-GCM
func (e *Encryptor) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrEncryptionFailed, err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrEncryptionFailed, err)
	}

	// Generate a random nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("%w: failed to generate nonce", ErrEncryptionFailed)
	}

	// Encrypt and authenticate
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts ciphertext using AES-256-GCM
func (e *Encryptor) Decrypt(ciphertext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("%w: invalid ciphertext encoding", ErrDecryptionFailed)
	}

	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrDecryptionFailed, err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrDecryptionFailed, err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("%w: ciphertext too short", ErrDecryptionFailed)
	}

	nonce, cipherData := data[:nonceSize], data[nonceSize:]

	plaintext, err := gcm.Open(nil, nonce, cipherData, nil)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrDecryptionFailed, err)
	}

	return string(plaintext), nil
}

// EncryptToken encrypts a token for storage
type EncryptedToken struct {
	Ciphertext string `json:"ciphertext"`
	Nonce      string `json:"nonce,omitempty"`
	Version    int    `json:"version"`
}

// EncryptToken encrypts a token/bearer string for storage at rest
func (e *Encryptor) EncryptToken(token string) (*EncryptedToken, error) {
	ciphertext, err := e.Encrypt(token)
	if err != nil {
		return nil, err
	}

	return &EncryptedToken{
		Ciphertext: ciphertext,
		Version:    1,
	}, nil
}

// DecryptToken decrypts a token from storage
func (e *Encryptor) DecryptToken(encrypted *EncryptedToken) (string, error) {
	if encrypted.Version != 1 {
		return "", fmt.Errorf("%w: unsupported version %d", ErrDecryptionFailed, encrypted.Version)
	}
	return e.Decrypt(encrypted.Ciphertext)
}

// TokenRotationConfig holds configuration for automatic token rotation
type TokenRotationConfig struct {
	Enabled         bool
	RotationAge     int64 // Rotation age in seconds
	WarningBefore   int64 // Warning before rotation in seconds
	LastRotation    int64 // Unix timestamp of last rotation
}

// ShouldRotate determines if a token should be rotated
func (c *TokenRotationConfig) ShouldRotate(tokenAge int64) bool {
	if !c.Enabled {
		return false
	}

	return tokenAge >= c.RotationAge
}

// ShouldWarn determines if a rotation warning should be issued
func (c *TokenRotationConfig) ShouldWarn(tokenAge int64) bool {
	if !c.Enabled {
		return false
	}

	return tokenAge >= (c.RotationAge - c.WarningBefore)
}

// SecretRotator handles secret rotation
type SecretRotator struct {
	validator *SecretValidator
	encryptor *Encryptor
}

// NewSecretRotator creates a new secret rotator
func NewSecretRotator(encryptionKey string) (*SecretRotator, error) {
	var encryptor *Encryptor
	var err error

	if encryptionKey != "" {
		encryptor, err = NewEncryptor(encryptionKey)
		if err != nil {
			return nil, err
		}
	}

	return &SecretRotator{
		validator: NewSecretValidator(),
		encryptor: encryptor,
	}, nil
}

// RotateSecret rotates a secret by generating a new one
func (r *SecretRotator) RotateSecret(oldSecret string) (string, error) {
	// Validate old secret
	if err := r.validator.Validate(oldSecret); err != nil {
		return "", fmt.Errorf("old secret validation failed: %w", err)
	}

	// Generate new secret
	newSecret, err := GenerateEncryptionKey()
	if err != nil {
		return "", fmt.Errorf("failed to generate new secret: %w", err)
	}

	return newSecret, nil
}

// EncryptSecret encrypts a secret for storage
func (r *SecretRotator) EncryptSecret(secret string) (*EncryptedToken, error) {
	if r.encryptor == nil {
		return nil, fmt.Errorf("encryptor not initialized")
	}

	return r.encryptor.EncryptToken(secret)
}

// DecryptSecret decrypts a secret from storage
func (r *SecretRotator) DecryptSecret(encrypted *EncryptedToken) (string, error) {
	if r.encryptor == nil {
		return "", fmt.Errorf("encryptor not initialized")
	}

	return r.encryptor.DecryptToken(encrypted)
}

// ValidateSecretsAtStartup validates all required secrets at application startup
func ValidateSecretsAtStartup(config map[string]string) []error {
	validator := NewSecretValidator()
	var errs []error

	requiredSecrets := []string{
		"MANAGEMENT_PASSWORD",
	}

	for _, key := range requiredSecrets {
		value := config[key]
		if value == "" {
			errs = append(errs, fmt.Errorf("%w: %s", ErrMissingSecret, key))
			continue
		}

		if err := validator.Validate(value); err != nil {
			errs = append(errs, fmt.Errorf("%s: %w", key, err))
		}
	}

	// Validate API keys if present
	for k, v := range config {
		if strings.HasPrefix(k, "API_KEY") || strings.HasSuffix(k, "_API_KEY") {
			if err := validator.ValidateAPIKey(v); err != nil {
				errs = append(errs, fmt.Errorf("%s: %w", k, err))
			}
		}
	}

	return errs
}

// LoadSecretsFromEnv loads secrets from environment variables
func LoadSecretsFromEnv() *SecretsConfig {
	config := &SecretsConfig{
		ManagementPassword: os.Getenv("MANAGEMENT_PASSWORD"),
		DatabasePassword:   os.Getenv("DATABASE_PASSWORD"),
		OAuthClientSecret: os.Getenv("OAUTH_CLIENT_SECRET"),
		EncryptionKey:     os.Getenv("ENCRYPTION_KEY"),
	}

	// Load API keys from comma-separated list
	if apiKeys := os.Getenv("API_KEYS"); apiKeys != "" {
		config.APIKeys = strings.Split(apiKeys, ",")
		for i := range config.APIKeys {
			config.APIKeys[i] = strings.TrimSpace(config.APIKeys[i])
		}
	}

	return config
}

// Helper functions

func containsWhitespace(s string) bool {
	for _, r := range s {
		if r == ' ' || r == '\t' || r == '\n' || r == '\r' {
			return true
		}
	}
	return false
}

func isComplex(s string) bool {
	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, r := range s {
		switch {
		case r >= 'A' && r <= 'Z':
			hasUpper = true
		case r >= 'a' && r <= 'z':
			hasLower = true
		case r >= '0' && r <= '9':
			hasNumber = true
		case r >= 32 && r <= 126:
			hasSpecial = true
		}
	}

	return hasUpper && hasLower && hasNumber && hasSpecial
}

// EncryptedTokenFile stores encrypted tokens in a file
type EncryptedTokenFile struct {
	Version   int                        `json:"version"`
	Tokens    map[string]*EncryptedToken `json:"tokens"`
	Rotation  *TokenRotationConfig        `json:"rotation,omitempty"`
	CreatedAt int64                      `json:"created_at"`
	UpdatedAt int64                      `json:"updated_at"`
}

// SaveTokenFile saves encrypted tokens to a file
func SaveTokenFile(path string, file *EncryptedTokenFile) error {
	file.UpdatedAt = getCurrentTimestamp()
	data, err := json.MarshalIndent(file, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0o600)
}

// LoadTokenFile loads encrypted tokens from a file
func LoadTokenFile(path string) (*EncryptedTokenFile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var file EncryptedTokenFile
	if err := json.Unmarshal(data, &file); err != nil {
		return nil, err
	}

	return &file, nil
}

func getCurrentTimestamp() int64 {
	return 0 // Placeholder - would use time.Now().Unix()
}
