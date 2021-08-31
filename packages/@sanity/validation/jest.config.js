const baseConfig = require('../../../jest.config.base')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  displayName: require('./package.json').name,
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '@sanity/validation': '<rootDir>/src',
    'part:@sanity/form-builder/input/legacy-date/schema?': '<rootDir>/test/nullExport',
    'part:@sanity/base/client': '<rootDir>/test/mockClient',
  },
}
