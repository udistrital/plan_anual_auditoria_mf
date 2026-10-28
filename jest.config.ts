export default {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  transform: {
    '^.+\\.(ts|js|html)$': 'jest-preset-angular'
  },
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  // Las pruebas E2E (Playwright) tienen su propio runner en e2e/
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
};