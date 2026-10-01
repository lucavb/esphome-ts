import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier/flat';

export default tseslint.config(
    { ignores: ['dist/**', 'coverage/**', 'reports/**', 'node_modules/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    {
        plugins: { 'unused-imports': unusedImports },
        languageOptions: { parserOptions: { projectService: true } },
        rules: {
            eqeqeq: 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'error',
                { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
            ],
        },
    },
    { files: ['src/api/protobuf/**'], extends: [tseslint.configs.disableTypeChecked] },
    {
        // The config file itself legitimately uses default-export property
        // access (`tseslint.configs`, `importX.flatConfigs`), which
        // import-x/no-named-as-default-member only false-positives on here.
        files: ['eslint.config.mjs'],
        extends: [tseslint.configs.disableTypeChecked],
        rules: {
            'import-x/no-named-as-default': 'off',
            'import-x/no-named-as-default-member': 'off',
            'import-x/no-unresolved': ['error', { ignore: ['@eslint/js', 'typescript-eslint'] }],
        },
    },
    prettier,
);
