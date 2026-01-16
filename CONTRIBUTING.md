# Contributing to CLIProxies

**Version:** 1.0.0
**Last Updated:** 2025-01-16

Thank you for your interest in contributing to CLIProxies! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Code Style Guidelines](#code-style-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Pull Request Process](#pull-request-process)
7. [Commit Message Guidelines](#commit-message-guidelines)
8. [Reporting Issues](#reporting-issues)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

### Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Reporting Issues

If you encounter any issues or have concerns, please contact the maintainers directly.

---

## Getting Started

### First-Time Contributors

Welcome! We appreciate any contribution, no matter how small. Here are some good ways to get started:

1. **Documentation improvements** - Fix typos, clarify confusing sections
2. **Bug reports** - Help us identify and fix issues
3. **Small bug fixes** - Check issues labeled "good first issue"
4. **Test improvements** - Add tests for uncovered code paths
5. **Feature requests** - Suggest improvements

### Project Structure

```
cliproxies/
├── CLIProxyAPI/          # Go backend API gateway
│   ├── cmd/              # Main application entry points
│   ├── internal/         # Internal packages (not exported)
│   │   ├── api/          # HTTP API handlers
│   │   ├── config/       # Configuration management
│   │   ├── logging/      # Logging utilities
│   │   └── ...           # Other internal packages
│   ├── pkg/              # Public packages (can be imported)
│   ├── sdk/              # SDK for embedding CLIProxyAPI
│   ├── docs/             # Go doc comments
│   ├── go.mod            # Go module definition
│   ├── go.sum            # Go dependencies lock
│   ├── config.yaml       # Configuration file
│   └── Dockerfile        # Container build
│
├── cliproxies-web/       # Next.js frontend
│   ├── src/              # Source code
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # React components
│   │   ├── lib/          # Utility libraries
│   │   └── styles/       # Global styles
│   ├── public/           # Static assets
│   ├── next.config.ts    # Next.js configuration
│   ├── package.json      # Node dependencies
│   ├── pnpm-lock.yaml    # Lock file
│   └── wrangler.toml     # Cloudflare Workers config
│
├── docs/                 # Project documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── CONFIGURATION.md
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
│
└── CONTRIBUTING.md       # This file
```

---

## Development Setup

### Backend (Go) Development

#### Prerequisites

- Go 1.24 or later
- Docker 20.10+ (for containerized development)
- Git 2.0+
- Make (optional, for using Makefile)

#### Setup Steps

1. **Fork and clone the repository:**

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/CLIProxyAPI.git
cd CLIProxyAPI
git remote add upstream https://github.com/router-for-me/CLIProxyAPI.git
```

2. **Install dependencies:**

```bash
go mod download
```

3. **Create a development configuration:**

```bash
cp config.example.yaml config.yaml
# Edit config.yaml with your settings
```

4. **Run the development server:**

```bash
# Run directly
go run ./cmd/server/

# Or use air for hot reload (install with: go install github.com/cosmtrek/air@latest)
air
```

5. **Run tests:**

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -race -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

6. **Build the binary:**

```bash
# Build for current platform
go build -o CLIProxyAPI ./cmd/server/

# Build for all platforms
go build -o bin/CLIProxyAPI-linux-amd64 ./cmd/server/
GOOS=darwin GOARCH=arm64 go build -o bin/CLIProxyAPI-darwin-arm64 ./cmd/server/
```

#### Useful Go Commands

```bash
# Format code
go fmt ./...

# Lint code (requires golangci-lint)
golangci-lint run

# Vet code for potential issues
go vet ./...

# List dependencies
go list -m all

# Update dependencies
go get -u ./...
go mod tidy

# View documentation
godoc -http=:6060
```

### Frontend (Next.js) Development

#### Prerequisites

- Node.js 20+
- pnpm 8+

#### Setup Steps

1. **Navigate to the frontend directory:**

```bash
cd cliproxies-web
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Create environment file:**

```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Run the development server:**

```bash
pnpm dev
```

5. **Build for production:**

```bash
pnpm build
```

6. **Run tests:**

```bash
# Lint code
pnpm lint

# Type check
pnpm typecheck

# Run tests (if configured)
pnpm test
```

---

## Code Style Guidelines

### Go Code Style

Follow standard Go conventions:

1. **Use `gofmt` formatting:**

```bash
gofmt -w -s .
```

2. **Naming conventions:**

- Packages: lowercase, single words when possible
- Exported names: PascalCase
- Internal names: camelCase
- Constants: PascalCase or UPPER_CASE
- Interfaces: PascalCase, often ending in "er"

3. **File organization:**

```go
// File structure template
package packagename

// Imports (grouped and sorted)
import (
    "fmt"        // Standard library
    "net/http"   // Standard library

    "github.com/gin-gonic/gin"  // External packages

    "github.com/router-for-me/CLIProxyAPI/v6/internal/config"  // Internal packages
)

// Constants
const (
    MaxRetries = 3
)

// Variables
var (
    globalVar string
)

// Types
type MyType struct {
    Field1 string
    Field2 int
}

// Interface definitions
type MyInterface interface {
    Method() error
}

// Functions
func NewMyType() *MyType {
    return &MyType{}
}

func (m *MyType) Method() error {
    return nil
}
```

4. **Error handling:**

```go
// Always handle errors explicitly
result, err := someFunction()
if err != nil {
    return fmt.Errorf("failed to do something: %w", err)
}

// Use error wrapping
if err != nil {
    return fmt.Errorf("context: %w", err)
}

// Never ignore errors
result, _ = someFunction()  // WRONG
result, err = someFunction()  // CORRECT
```

5. **Comments:**

```go
// Package comments provide overview
// Package mypackage provides functionality for X.
package mypackage

// Exported functions must have comments
// MyFunction does something useful.
// It takes a context and returns a result or error.
func MyFunction(ctx context.Context) (*Result, error) {
    // ...
}

// Complex logic should be commented
// Check if the request is from a known client
// by examining the User-Agent header
if isKnownClient(userAgent) {
    // ...
}
```

### TypeScript/React Code Style

1. **Use functional components:**

```typescript
// Good: Functional component with hooks
export function MyComponent({ prop }: Props) {
  const [state, setState] = useState<string>("");

  useEffect(() => {
    // Effect logic
  }, []);

  return <div>{prop}</div>;
}
```

2. **Use TypeScript strictly:**

```typescript
// Define interfaces for props
interface MyComponentProps {
  title: string;
  count?: number; // Optional
}

// Type all function parameters
function processData(data: string[]): number {
  return data.length;
}
```

3. **Follow naming conventions:**

- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

4. **Use imports correctly:**

```typescript
// Order: 1. React, 2. Third-party, 3. Relative imports
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MyComponent } from "./MyComponent";
```

### Documentation Style

1. **API documentation:**

````markdown
### Endpoint Name

Brief description of what this endpoint does.

**Endpoint:** `METHOD /path/to/endpoint`

**Request:**

```json
{
  "field": "value"
}
```
````

**Response:**

```json
{
  "result": "value"
}
```

**Error Responses:**

| Code | Description |
| ---- | ----------- |
| 400  | Bad request |

````

2. **Code comments:**

```go
// FunctionName performs a specific task.
// It takes the following parameters:
//   - ctx: The request context
//   - input: The input data to process
//
// Returns the processed result and any error encountered.
func FunctionName(ctx context.Context, input string) (*Result, error) {
    // ...
}
````

---

## Testing Requirements

### Go Testing

1. **Write tests for all new functionality:**

```go
package mypackage_test

import (
    "testing"
)

func TestMyFunction(t *testing.T) {
    // Arrange
    input := "test"

    // Act
    result, err := MyFunction(input)

    // Assert
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if result != "expected" {
        t.Errorf("expected 'expected', got '%s'", result)
    }
}

func TestMyFunctionErrors(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantErr bool
    }{
        {"valid input", "valid", false},
        {"invalid input", "", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            _, err := MyFunction(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("expected error: %v, got: %v", tt.wantErr, err)
            }
        })
    }
}
```

2. **Test coverage requirements:**

- Aim for >80% code coverage
- All exported functions should have tests
- Edge cases should be tested

3. **Run tests before committing:**

```bash
# Run all tests
go test ./...

# Run with race detection
go test -race ./...

# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Frontend Testing

1. **Component testing:**

```typescript
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("handles user interaction", () => {
    render(<MyComponent title="Test" />);
    const button = screen.getByRole("button");
    button.click();
    // Assert expected behavior
  });
});
```

2. **Run linting and type checking:**

```bash
# Lint
pnpm lint

# Type check
pnpm typecheck
```

---

## Pull Request Process

### Creating a Pull Request

1. **Create a feature branch:**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make your changes:**

- Write clean, well-commented code
- Add/update tests
- Update documentation

3. **Commit your changes (see Commit Guidelines below):**

```bash
git add .
git commit -m "feat: add new feature"
```

4. **Push to your fork:**

```bash
git push origin feature/your-feature-name
```

5. **Create a Pull Request:**

- Go to the GitHub repository
- Click "New Pull Request"
- Select your branch
- Provide a clear description

### PR Description Template

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Review Process

1. **Automated checks:**
   - All tests must pass
   - Code must lint cleanly
   - Coverage must not decrease

2. **Code review:**
   - At least one maintainer approval required
   - Address all review comments

3. **Merge:**
   - Squash and merge for small changes
   - Rebase and merge for feature branches
   - Maintain clean commit history

---

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvement
- `ci`: CI/CD changes

### Examples

```
feat(api): add streaming support for chat completions

Add server-sent events (SSE) streaming for the chat completions
endpoint. This allows clients to receive responses in real-time.

Closes #123
```

```
fix(auth): handle expired OAuth tokens gracefully

When an OAuth token expires, automatically attempt to refresh
instead of returning an error to the client.

Fixes #456
```

```
docs(api): update authentication documentation

Clarify the OAuth flow for new providers. Add examples for
Qwen and iFlow authentication.
```

### Breaking Changes

If your PR introduces breaking changes, add `BREAKING CHANGE:` to the footer:

```
feat(config): redesign configuration structure

The configuration file structure has been redesigned for better
clarity. Old configuration files will need to be migrated.

BREAKING CHANGE: Configuration file format has changed.
Use the migration tool to convert existing configs.
```

---

## Reporting Issues

### Before Reporting

1. **Search existing issues:** Check if the issue has already been reported
2. **Check documentation:** Review relevant documentation
3. **Try the latest version:** Ensure the issue hasn't been fixed

### Issue Report Template

```markdown
## Description

Clear description of the issue.

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- OS: [e.g., Ubuntu 22.04]
- Go version: [e.g., 1.24]
- CLIProxyAPI version: [e.g., v1.0.0]
- Deployment: [Docker / Binary]

## Configuration

<!-- Sanitized configuration -->

## Logs

<!-- Relevant log output -->

## Additional Context

Any other relevant information.
```

### Bug Reports

For bug reports, please include:

- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Logs (sanitized)
- Configuration (sanitized)

### Feature Requests

For feature requests:

- Describe the use case
- Explain why it's needed
- Suggest a possible implementation
- Consider if it fits the project scope

---

## Additional Resources

- [API Documentation](./docs/API.md)
- [Configuration Reference](./docs/CONFIGURATION.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- [GitHub Repository](https://github.com/router-for-me/CLIProxyAPI)

---

## License

By contributing to CLIProxies, you agree that your contributions will be licensed under the MIT License.
