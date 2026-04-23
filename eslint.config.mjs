// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPlugin from 'eslint-plugin-eslint-plugin'
import tseslint from 'typescript-eslint';

export default defineConfig(
    { ignores: ["dist"] },
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    eslintPlugin.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["*.config.*"],
                    defaultProject: "tsconfig.json"
                },
            },
        },
    },
);
