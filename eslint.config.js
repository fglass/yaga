const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');

const tsRecommendedRules =
    tsPlugin.configs['flat/recommended'].find(
        (config) => config.name === 'typescript-eslint/recommended',
    )?.rules ?? {};
const tsEslintRecommendedRules =
    tsPlugin.configs['flat/eslint-recommended']?.rules ?? {};

module.exports = [
    {
        ignores: [
            'node_modules/**',
            '.expo/**',
        ],
    },
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'off',
        },
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.node,
                ...globals.browser,
                __DEV__: 'readonly',
            },
        },
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.node,
                ...globals.browser,
                __DEV__: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsEslintRecommendedRules,
            ...tsRecommendedRules,
        },
    },
    {
        files: ['**/*.{jsx,tsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
        },
    },
    {
        files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
        ignores: ['model/database/**'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/model/database/*'],
                            message:
                                'Import from model/database (index.ts) instead of deep paths.',
                        },
                    ],
                },
            ],
        },
    },
];
