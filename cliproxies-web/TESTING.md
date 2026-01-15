# Testing Documentation

This document describes the test coverage and testing practices for the cliproxies-web project.

## Test Structure

```
src/
├── lib/
│   ├── config-generator.test.ts     # Config YAML generation tests
│   ├── config-download.test.ts      # File download functionality tests
│   ├── github.test.ts               # GitHub API integration tests
│   ├── proxygrid.test.ts            # ProxyGrid API client tests
│   ├── status.test.ts               # Provider status monitoring tests
│   └── utils.test.ts                # Utility functions tests
├── stores/
│   └── config-store.test.ts         # Zustand store tests
├── hooks/
│   ├── use-os.test.ts               # OS detection hook tests
│   └── use-toast.test.ts            # Toast notification hook tests
├── data/
│   ├── ecosystem.test.ts            # App ecosystem data tests
│   └── sponsors.test.ts             # Sponsor data tests
├── components/
│   ├── ui/
│   │   ├── button.test.tsx          # Button component tests
│   │   ├── badge.test.tsx           # Badge component tests
│   │   ├── input.test.tsx           # Input component tests
│   │   ├── card.test.tsx            # Card component tests
│   │   └── tabs.test.tsx            # Tabs component tests
│   ├── app-card.test.tsx            # App card component tests
│   └── hero-section.test.tsx        # Hero section component tests
├── app/api/
│   ├── github-stars/
│   │   └── route.test.ts            # GitHub stars API route tests
│   └── status/
│       └── route.test.ts            # Status API route tests
└── test/
    ├── setup.ts                     # Test environment setup
    ├── test-utils.tsx               # Custom render utilities
    └── mockData.ts                  # Shared mock data
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Configuration

The `vitest.config.ts` file configures:

- **Environment**: jsdom for component tests, node for API tests
- **Setup Files**: `src/test/setup.ts` for global test configuration
- **Coverage**: Excludes test files, mocks, and config files
- **Path Aliases**: `@/*` maps to `./src/*`

## Coverage Goals

Target coverage: **80%+** for all critical paths

- Utilities: 100%
- Components: 80%+
- Hooks: 90%+
- API Routes: 85%+
- Stores: 90%+
- Data Validation: 100%

## Test Categories

### Unit Tests

Test individual functions and components in isolation.

**Examples:**

- `utils.test.ts` - className merging utility
- `config-generator.test.ts` - YAML config generation
- `github.test.ts` - URL parsing functions

### Component Tests

Test React components with user interactions.

**Examples:**

- `button.test.tsx` - Button variants and interactions
- `app-card.test.tsx` - App card with microdata
- `hero-section.test.tsx` - Hero section with CTAs

### Hook Tests

Test custom React hooks.

**Examples:**

- `use-os.test.ts` - OS detection logic
- `use-toast.test.ts` - Toast notifications

### Integration Tests

Test multiple units working together.

**Examples:**

- `config-store.test.ts` - State management
- `proxygrid.test.ts` - API client with caching

### API Route Tests

Test Next.js API routes.

**Examples:**

- `github-stars/route.test.ts` - GitHub stars endpoint
- `status/route.test.ts` - Provider status endpoint

## Testing Best Practices

### 1. Arrange-Act-Assert (AAA) Pattern

```typescript
it("adds a key to the store", () => {
  // Arrange
  const store = createMockStore();

  // Act
  store.addApiKey("test-key");

  // Assert
  expect(store.getState().apiKeys).toContain("test-key");
});
```

### 2. Descriptive Test Names

```typescript
// Good
it("returns 400 when repo parameter is missing", () => {});

// Bad
it("handles error", () => {});
```

### 3. Test Isolation

Each test should be independent and clean up after itself.

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 4. Mock External Dependencies

```typescript
vi.mock("@/lib/github", () => ({
  fetchRepoStars: vi.fn(),
}));
```

### 5. Test Edge Cases

```typescript
it("handles empty input", () => {});
it("handles special characters", () => {});
it("handles very long input", () => {});
```

## Accessibility Tests

Components are tested for:

- Keyboard navigation
- ARIA labels
- Screen reader compatibility
- Focus indicators
- Semantic HTML

## Visual Regression

Visual snapshots are captured for key pages:

- Hero section
- App cards
- Config generator

## Performance Tests

Tests verify:

- Bundle size limits
- Component render performance
- API response caching
- Cache invalidation

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Main branch commits
- Before deployment

## Writing New Tests

When adding new functionality:

1. **Create test file** alongside the source file
2. **Name it** `filename.test.ts` or `filename.test.tsx`
3. **Import utilities** from `@/test/test-utils`
4. **Use mocks** from `@/test/mockData`
5. **Follow AAA pattern**
6. **Test edge cases**
7. **Verify accessibility**

## Test Utilities

### Custom Render

```typescript
import { renderWithProviders } from "@/test/test-utils";

renderWithProviders(<MyComponent />);
```

### Mock Data

```typescript
import { mockApp, mockSponsor } from "@/test/mockData";
```

### User Actions

```typescript
import { userEvent } from "@testing-library/user-event";

await userEvent.click(button);
await userEvent.type(input, "text");
```

## Debugging Tests

### Run Single Test File

```bash
npx vitest run path/to/test.test.ts
```

### Run Tests Matching Pattern

```bash
npx vitest run -t "test name"
```

### Debug Mode

```bash
npx vitest --inspect-brk
```

## Known Limitations

1. **E2E Tests**: Not yet implemented - consider Playwright or Cypress
2. **Visual Regression**: Basic structure only, needs integration with Percy/Chromatic
3. **Performance Benchmarks**: Manual testing only currently
4. **API Route Edge Runtime**: Tests use mocked fetch, not actual edge runtime

## Future Improvements

- [ ] Add E2E test suite with Playwright
- [ ] Add visual regression testing
- [ ] Add performance benchmarking
- [ ] Add load testing for API routes
- [ ] Add accessibility audit with axe-core
- [ ] Add internationalization tests
