# Testing Guide - Gym Management System

## Overview

This document describes the testing infrastructure, how to run tests, and how to write new tests for the Gym Management System.

## Test Structure

The test suite is organized into three main categories:

### 1. Unit Tests (`tests/unit/`)

* **database.test.js**: Database initialization and connection tests
* **auth.test.js**: User authentication and authorization tests
* **members.test.js**: Member CRUD operations and validation
* **trainers.test.js**: Trainer management tests
* **payments.test.js**: Payment processing and subscription renewal tests

### 2. Integration Tests (`tests/integration/`)

* **userFlows.test.js**: Complete user workflows, concurrent operations, and RBAC isolation

### 3. E2E Tests (`tests/e2e/`)

* **login.spec.js**: Login flow end-to-end tests
* **members.spec.js**: Member management UI tests
* **adminIsolation.spec.js**: RBAC and data isolation UI tests

## Testing Technologies

* **Jest**: Unit and integration testing framework
* **Playwright**: E2E testing for Electron application
* **ESLint**: Code linting and quality checks
* **SQLite**: In-memory test databases for isolation

## Running Tests Locally

### Prerequisites

```bash
# Install dependencies
npm install
```

### Running All Tests

```bash
# Run all tests (unit + integration)
npm test

# Run with coverage report
npm run test:coverage
```

### Running Specific Test Suites

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only E2E tests
npm run test:e2e

# Run specific test file
npx jest tests/unit/auth.test.js

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch
```

### Running Linter

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

## Test Database Strategy

All tests use **isolated, temporary SQLite databases** to ensure:

* No interference with production data
* Deterministic test results
* Fast test execution
* Easy cleanup

Each test suite creates its own database instance and cleans it up after tests complete.

## Writing New Tests

### Unit Test Example

```javascript
const TestHelper = require('../helpers/testHelper');

describe('My Feature', () => {
  let testHelper;
  let db;

  beforeEach(async () => {
    testHelper = new TestHelper();
    db = await testHelper.createTestDatabase();
  });

  afterEach(async () => {
    await testHelper.cleanupTestDatabase();
  });

  test('should do something', async () => {
    // Arrange
    const user = await testHelper.createTestUser('testuser', 'password', 'staff');
    
    // Act
    const result = await db.someMethod(user);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### E2E Test Example

```javascript
const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('My Feature E2E', () => {
  let electronApp;
  let window;

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../main.js')]
    });
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('should work in UI', async () => {
    await window.click('button.my-button');
    const result = await window.locator('.result').textContent();
    expect(result).toBe('Expected');
  });
});
```

## CI/CD Pipeline

Tests run automatically on:

* **Pull Requests**: All tests must pass before merging
* **Pushes to main/develop**: Full test suite with coverage reports

### Pipeline Steps

1. Install dependencies
2. Run ESLint
3. Run unit tests
4. Run integration tests
5. Run E2E tests (may be flaky in CI)
6. Generate coverage report
7. Upload artifacts

### Coverage Requirements

The project aims for:

* **Lines**: 70%+
* **Functions**: 70%+
* **Branches**: 70%+
* **Statements**: 70%+

## Test Helpers

### TestHelper Class

Located in `tests/helpers/testHelper.js`, provides:

* `createTestDatabase()`: Create isolated test database
* `cleanupTestDatabase()`: Clean up test database
* `createTestUser(username, password, role)`: Create test user
* `createTestMember(data, user)`: Create test member
* `createTestTrainer(data, user)`: Create test trainer
* `getUserByUsername(username)`: Get user from database
* `getMemberById(id)`: Get member from database
* `countRecords(tableName)`: Count records in table

### Global Test Utilities

Available via `global.testUtils`:

* `sleep(ms)`: Wait for milliseconds
* `randomString(length)`: Generate random string
* `randomEmail()`: Generate random email
* `randomPhone()`: Generate random phone number

## Common Testing Patterns

### Testing RBAC

```javascript
test('should enforce RBAC', async () => {
  const staff = await testHelper.createTestUser('staff', 'pass', 'staff');
  const admin = await testHelper.getUserByUsername('admin');
  
  // Staff can only see own data
  const staffData = await db.getAllMembers(staff);
  expect(staffData.every(m => m.created_by === staff.id)).toBe(true);
  
  // Admin can see all data
  const adminData = await db.getAllMembers(admin);
  expect(adminData.length).toBeGreaterThan(staffData.length);
});
```

### Testing Validation

```javascript
test('should validate input', async () => {
  await expect(db.addMember({ name: '' }, user))
    .rejects.toThrow('اسم العضو مطلوب');
});
```

### Testing Transactions

```javascript
test('should rollback on error', async () => {
  const initialCount = await testHelper.countRecords('members');
  
  try {
    await db.addMember({ invalid: 'data' }, user);
  } catch (error) {
    // Expected
  }
  
  const finalCount = await testHelper.countRecords('members');
  expect(finalCount).toBe(initialCount);
});
```

## Troubleshooting

### Tests Timeout

Increase timeout in test file:

```javascript
jest.setTimeout(60000); // 60 seconds
```

### Database Lock Errors

Ensure tests run serially (already configured in `jest.config.js`):

```javascript
maxWorkers: 1
```

### E2E Tests Fail in CI

E2E tests may be flaky in CI environments. They're marked as `continue-on-error` in the pipeline.

### Coverage Not Generated

Ensure you're running:

```bash
npm run test:coverage
```

## Best Practices

1✅ **Isolate tests**: Each test should be independent
2\. **Use beforeEach/afterEach**: Set up and tear down properly
3\. **Test edge cases**: Empty inputs, null values, boundary conditions
4\. **Mock external dependencies**: Don't rely on external services
5\. **Keep tests fast**: Use in-memory databases, avoid unnecessary waits
6\. **Descriptive names**: Test names should explain what they verify
7\. **Assert clearly**: Use specific expectations, not generic ones

## Additional Resources

* [Jest Documentation](https://jestjs.io/)
* [Playwright Documentation](https://playwright.dev/)
* [ESLint Documentation](https://eslint.org/)

## Support

For questions or issues with tests, please refer to the main project documentation or contact the development team.
