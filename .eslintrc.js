module.exports = {
    root: true,
    extends: ['eslint:recommended', 'prettier'],
    ignorePatterns: ['node_modules', 'dist', '.next', 'out'],
    rules: {
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
};