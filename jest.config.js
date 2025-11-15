/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // This tells Jest to look for test files in all of our packages
    projects: [
        '<rootDir>/packages/apps/*',
        '<rootDir>/packages/services/*',
        '<rootDir>/packages/libs/*',
    ],
    // A map to help Jest resolve module imports, especially for our monorepo structure
    moduleNameMapper: {
        '^@flowsplit/(.*)$': '<rootDir>/packages/$1/src',
    },
    // Ignore the .next build directory in the web app
    testPathIgnorePatterns: ['<rootDir>/packages/apps/web/.next/'],
};