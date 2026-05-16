module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^next/(.*)$': '<rootDir>/__mocks__/next/$1.js',
    '^next$': '<rootDir>/__mocks__/next/index.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/', '<rootDir>/.next/'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
