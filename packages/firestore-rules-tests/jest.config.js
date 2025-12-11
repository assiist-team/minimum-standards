/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleNameMapper: {
    '^@minimum-standards/shared-model$': '<rootDir>/../shared-model/src/index.ts',
    '^@minimum-standards/shared-model/(.*)$': '<rootDir>/../shared-model/src/$1',
    '^@minimum-standards/firestore-model$': '<rootDir>/../firestore-model/src/index.ts',
    '^@minimum-standards/firestore-model/(.*)$': '<rootDir>/../firestore-model/src/$1'
  },
  testMatch: ['<rootDir>/**/*.test.ts']
};
