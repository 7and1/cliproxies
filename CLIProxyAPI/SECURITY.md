# Security Policy

## Supported Versions

Currently security updates are provided for the latest version of CLIProxyAPI.

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead, send an email to security@router-for-me or use a private vulnerability disclosure method.

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested mitigation (if any)

## Security Features

### Backend Security (CLIProxyAPI)

#### Headers and Middleware

- **Security Headers**: All responses include OWASP-recommended security headers
  - `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
  - `X-Frame-Options: DENY` - Prevents clickjacking
  - `X-XSS-Protection: 1; mode=block` - Enables browser XSS filter
  - `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
  - `Permissions-Policy` - Restricts browser features access
  - `Strict-Transport-Security` - Enforces HTTPS (production only)

#### Input Validation

- Request size limits (10MB default)
- Query string length limits (2KB default)
- Header size limits (8KB default)
- Path traversal detection and blocking
- Input sanitization for all user inputs

#### Authentication & Authorization

- API key validation
- OAuth 2.0 with PKCE support
- Session management with token expiration
- Rate limiting per API key/IP

#### Secrets Management

- Secrets validation at startup
- Token encryption at rest (AES-256-GCM)
- API key rotation mechanism
- No default credentials in production

#### Audit Logging

- Authentication success/failure events
- Authorization denials
- Configuration changes
- Security events and suspicious activity

### Frontend Security (cliproxies-web)

#### Content Security Policy (CSP)

- Strict CSP with nonce-based script execution
- Default-src: `'self'`
- Script-src: `'self' 'nonce-{value}'`
- No unsafe inline styles or scripts in production

#### Additional Protections

- Subresource Integrity (SRI) for external scripts
- CSRF protection for state-changing operations
- Referrer policy: `strict-origin-when-cross-origin`
- XSS prevention through input sanitization
- Secure localStorage wrapper with namespacing

#### Local Storage

- Namespaced keys to avoid collisions
- Sensitive data warning
- Clear functionality for user data

## Configuration Security

### Secrets Requirements

#### Management Password

- Minimum length: 16 characters
- No whitespace allowed
- Must not contain default values
- Stored hashed in configuration

#### API Keys

- Minimum length: 10 characters
- Maximum length: 256 characters
- No whitespace allowed
- Regular rotation recommended (90 days)

#### Encryption Key

- Must be valid base64
- Decoded length must be 32 bytes (AES-256)
- Used for token encryption at rest

### Environment Variables

```bash
# Required for production
MANAGEMENT_PASSWORD=your-secure-management-password
ENCRYPTION_KEY=base64-encoded-32-byte-key

# Optional security settings
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW=60000

# CORS settings
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com

# Session settings
SESSION_MAX_AGE=3600000
```

## Best Practices

### Deployment

1. Use HTTPS in production (required for HSTS)
2. Set strong, unique passwords
3. Enable rate limiting
4. Configure appropriate CORS origins
5. Regular security audits
6. Keep dependencies updated

### Secret Management

1. Never commit secrets to version control
2. Use environment variables for secrets
3. Rotate credentials regularly
4. Use different keys for development and production
5. Implement secret scanning in CI/CD

### Monitoring

1. Enable audit logging
2. Monitor for suspicious activity
3. Set up alerts for security events
4. Regular log reviews
5. Implement intrusion detection

## Dependencies

This project uses the following security-focused dependencies:

- `golang.org/x/crypto` - For cryptographic operations
- `github.com/gin-gonic/gin` - HTTP framework with security features
- `github.com/sirupsen/logrus` - Structured logging for audit trails

## Security Testing

Security tests are included in:

- `/internal/security/secrets_test.go` - Secrets validation tests
- `/internal/api/middleware/security_test.go` - Security middleware tests
- `/src/lib/security.test.ts` - Frontend security utilities tests

Run security tests with:

```bash
# Backend
go test ./internal/security/... ./internal/api/middleware/...

# Frontend
npm test -- src/lib/security.test.ts
```

## License

This security policy is part of the CLIProxyAPI project and follows the same license.
