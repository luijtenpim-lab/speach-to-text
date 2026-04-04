module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  moduleNameMapper: {
    electron: '<rootDir>/tests/__mocks__/electron.js'
  }
}
