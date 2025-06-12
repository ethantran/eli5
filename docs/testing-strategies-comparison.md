# Testing Strategies Comparison

## Overview

This document compares different testing approaches available in our project, helping you choose the right testing strategy for different scenarios.

## Testing Approaches Spectrum

```
Isolation ←→ Realism
Speed ←→ Completeness

Unit Tests → Browser Mode → Integration → E2E
(Fastest)                              (Most Realistic)
```

## Detailed Comparison

| Aspect | Vitest Unit | Vitest Browser Mode | Integration Tests | Playwright E2E |
|--------|-------------|---------------------|-------------------|----------------|
| **Environment** | Node.js + jsdom | Real browser engine | Mixed (Node.js + browser) | Full browser automation |
| **Speed** | ⚡ Fastest (10-50ms) | 🚀 Fast (100-500ms) | ⏱️ Medium (500ms-2s) | 🐌 Slow (2-10s) |
| **DOM Simulation** | jsdom/happy-dom | Real browser DOM | Real browser DOM | Real browser DOM |
| **JavaScript Engine** | Node.js V8 | Browser engine | Browser engine | Browser engine |
| **CSS Support** | Limited | Full CSS support | Full CSS support | Full CSS support |
| **Network Requests** | Mocked | Can be real/mocked | Can be real/mocked | Real network calls |
| **User Interactions** | Simulated events | Real browser events | Real browser events | Real user actions |
| **Scope** | Single function/component | Component + dependencies | Multiple components/services | Full user workflows |
| **Debugging** | Node.js debugger | Browser DevTools | Browser DevTools | Screenshots + traces |
| **Parallelization** | Excellent | Good | Limited | Limited |
| **CI/CD Speed** | Excellent | Good | Moderate | Poor |

## When to Use Each

### 1. Vitest Unit Tests (Node.js + jsdom)
```bash
npm run test
```

**Best for:**
- Pure functions and business logic
- Component prop validation
- State management logic
- Utility functions
- Quick feedback during development

**Example scenarios:**
- Testing a date formatting function
- Validating component renders with different props
- Testing custom hooks
- Validation logic

**Trade-offs:**
- ✅ Extremely fast
- ✅ Great for TDD
- ✅ Excellent debugging
- ❌ DOM behavior differences from real browsers
- ❌ No CSS layout testing
- ❌ Limited browser API support

### 2. Vitest Browser Mode (Real Browser Engine)
```bash
npm run test # (configured in vitest.config.ts)
```

**Best for:**
- Component behavior that depends on real browser APIs
- CSS-dependent functionality
- Component integration with minimal dependencies
- Testing browser-specific features

**Example scenarios:**
- Components using ResizeObserver
- CSS-in-JS behavior
- Local storage interactions
- Component accessibility testing

**Trade-offs:**
- ✅ Real browser environment
- ✅ Faster than full E2E
- ✅ Better browser API support
- ❌ Slower than unit tests
- ❌ Still requires mocking for complex scenarios
- ❌ Limited to component-level testing

### 3. Integration Tests
```bash
# Can be run with either framework depending on scope
npm run test # (Vitest for component integration)
npm run test:e2e # (Playwright for service integration)
```

**Best for:**
- Multiple components working together
- Component + API interactions
- Service layer integration
- Database + business logic

**Example scenarios:**
- Form submission with validation + API call
- User authentication flow (login + state management)
- Shopping cart functionality
- Search with filters and results

**Trade-offs:**
- ✅ Tests realistic component interactions
- ✅ Catches integration bugs
- ✅ Validates API contracts
- ❌ Slower than unit tests
- ❌ Harder to debug failures
- ❌ More brittle than unit tests

### 4. Playwright E2E Tests
```bash
npm run test:e2e
```

**Best for:**
- Complete user workflows
- Cross-page functionality
- Real browser compatibility
- Visual regression testing

**Example scenarios:**
- Complete user registration process
- Multi-step checkout flow
- File upload and processing
- Real-time chat functionality

**Trade-offs:**
- ✅ Tests exactly what users experience
- ✅ Catches real-world issues
- ✅ Cross-browser testing
- ✅ Visual validation
- ❌ Slowest execution
- ❌ Flaky (network, timing issues)
- ❌ Expensive to maintain

## Our Project Configuration

### Vitest Unit Tests
```typescript
// vitest.config.ts - Node.js environment
environmentMatchGlobs: [
  ["**", "browser"], // Most tests run in browser mode
  ["convex/**", "edge-runtime"], // Convex functions in edge runtime
]
```

### Vitest Browser Mode
```typescript
// vitest.config.ts - Real browser
browser: {
  enabled: true,
  provider: 'playwright',
  instances: [{ browser: 'chromium' }],
}
```

### Playwright E2E
```typescript
// playwright.config.ts - Full automation
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
}
```

## Testing Strategy Recommendations

### 1. Testing Pyramid
```
     E2E Tests (5-10%)
    ─────────────────
   Integration (20-30%)
  ─────────────────────
 Unit + Browser Mode (60-75%)
─────────────────────────────
```

### 2. Component Testing Strategy
```typescript
// 1. Unit test props and basic rendering
test('renders with correct props', () => {
  render(<Component title="test" />)
  expect(screen.getByText('test')).toBeInTheDocument()
})

// 2. Browser mode for interactions
test('handles click events', async () => {
  // Real browser event handling
})

// 3. Integration for component communication
test('form submission updates parent state', () => {
  // Multiple components working together
})

// 4. E2E for user workflows
test('user can complete signup process', () => {
  // Full user journey
})
```

### 3. When to Move Up the Pyramid

**Move from Unit → Browser Mode when:**
- Need real browser APIs (ResizeObserver, IntersectionObserver)
- Testing CSS-dependent behavior
- Component uses complex event handling

**Move from Browser Mode → Integration when:**
- Testing component communication
- API interactions are critical
- State management across components

**Move from Integration → E2E when:**
- Testing complete user workflows
- Cross-page functionality
- Real network conditions matter
- Visual validation needed

## Best Practices

### 1. Start Small, Go Big
- Begin with unit tests for core logic
- Add browser mode for browser-specific features
- Use integration tests for component cooperation
- Reserve E2E for critical user paths

### 2. Optimize for Feedback Speed
- 80% unit/browser mode tests (fast feedback)
- 15% integration tests (catch interaction bugs)
- 5% E2E tests (validate critical paths)

### 3. Choose Based on Risk
- High-risk, high-value features → Full pyramid
- Utility functions → Unit tests only
- UI components → Unit + browser mode
- User workflows → Integration + E2E

## Examples from Our Codebase

### Unit Testing
```typescript
// tests/components/level-dropdown.test.tsx
test('displays correct level options', () => {
  // Fast, isolated component testing
})
```

### Browser Mode Testing
```typescript
// Real browser environment for complex interactions
test('dropdown opens on click', async () => {
  // Real browser event handling
})
```

### E2E Testing
```typescript
// tests/guest-chat-e2e.spec.ts
test('should create a message and get AI response', async ({ page }) => {
  // Full user workflow testing
})
```

## Tool Commands Quick Reference

```bash
# Unit/Browser Mode Tests (Vitest)
npm run test              # Run all tests
npm run test:once         # Single run
npm run test:ui           # Interactive UI
npm run test:coverage     # Coverage report

# E2E Tests (Playwright)
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:debug    # Debug mode
npx playwright test file.spec.ts  # Specific file
```

## Conclusion

Choose your testing approach based on:
1. **Speed requirements** - How fast do you need feedback?
2. **Realism needs** - How close to production behavior?
3. **Maintenance cost** - How much complexity can you handle?
4. **Risk level** - How critical is this functionality?

Remember: **The best test is the one that catches bugs before users do, runs fast enough for your workflow, and doesn't break when you refactor.** 