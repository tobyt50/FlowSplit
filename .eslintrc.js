module.exports = {
    root: true,
    extends: ['eslint:recommended', 'prettier'],
    ignorePatterns: ['node_modules', 'dist'],
    rules: {
        'no-console': 'warn',
    },
};