const nextJest = require('next/jest')();

const createJestConfig = nextJest({
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        // This helps Jest find our local library files
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/components/(.*)$': '<rootDir>/components/$1',
    },
};

module.exports = createJestConfig(customJestConfig);