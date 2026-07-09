module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*)',
  ],
  testMatch: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@campus-connect/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '^@campus-connect/types$': '<rootDir>/../../packages/types/src/index.ts',
  },
  collectCoverageFrom: ['App.tsx', 'src/**/*.{ts,tsx}'],
};
