// Jest setup file
// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
    // Helper to wait for async operations
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Helper to generate random test data
    randomString: (length = 8) => Math.random().toString(36).substring(2, length + 2),

    randomEmail: () => `test${Math.random().toString(36).substring(2, 10)}@example.com`,

    randomPhone: () => `555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`
};
