# @adobe/eslint-plugin-premierepro

ESLint rules for Adobe Premiere Pro UXP API usage. Helps catch common mistakes at development time that would otherwise only surface as runtime exceptions.

## Installation

```bash
npm install @adobe/eslint-plugin-premierepro --save-dev
```

## Usage

This plugin provides two tiers of rules:

- **Syntactic rules** — work in any JavaScript or TypeScript project. They use naming conventions and AST patterns to detect issues.
- **Type-checked rules** — require [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) with `@typescript-eslint/parser` and a `tsconfig.json`. They use TypeScript's type checker for more accurate detection, eliminating false positives and catching patterns (like wrapper functions) that syntactic rules cannot.

If your project uses TypeScript with typed linting, use `recommendedTypeChecked`. Otherwise, use `recommended`.

### Flat config (ESLint >= 9)

**Syntactic only** (works with any JavaScript or TypeScript project):

```js
// eslint.config.js
import premierepro from "@adobe/eslint-plugin-premierepro";

export default [
  premierepro.configs.recommended
];
```

**Type-checked** (requires typed linting):

```js
// eslint.config.js
import premierepro from "@adobe/eslint-plugin-premierepro";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  premierepro.configs.recommendedTypeChecked,
  // Needed to enable TypeScript's type checking service, see:
  // https://typescript-eslint.io/getting-started/typed-linting
  {
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    },
  }
);
```

Or configure individual rules:

```js
// eslint.config.js
import premierepro from "@adobe/eslint-plugin-premierepro";

export default [
  {
    plugins: { "@adobe/premierepro": premierepro },
    rules: {
      "@adobe/premierepro/require-action-lock-scope-type-checked": "error",
      "@adobe/premierepro/require-execute-transaction-type-checked": "error",
      // ...
    },
  },
];
```

## Rules

### Syntactic rules

These rules work in any project without type information. They use naming conventions (e.g. `create*Action()` patterns) to detect issues.

| Rule                                                                               | Description                                                                                             | Recommended |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | :---------: |
| [`require-action-lock-scope`](docs/rules/require-action-lock-scope.md)             | Require `create*Action()` calls to be within `Project.lockedAccess()` or `Project.executeTransaction()` |    error    |
| [`require-execute-transaction`](docs/rules/require-execute-transaction.md)         | Require `addAction()` calls to be within `Project.executeTransaction()`                                 |    error    |
| [`no-async-in-locked-access`](docs/rules/no-async-in-locked-access.md)             | Disallow async operations inside `lockedAccess()` callbacks                                             |    error    |
| [`no-async-in-execute-transaction`](docs/rules/no-async-in-execute-transaction.md) | Disallow async operations inside `executeTransaction()` callbacks                                       |    error    |
| [`no-action-scope-escape`](docs/rules/no-action-scope-escape.md)                   | Disallow action objects from escaping their lock scope                                                  |    error    |
| [`prefer-locked-access-wrapper`](docs/rules/prefer-locked-access-wrapper.md)       | Recommend wrapping `executeTransaction()` in `lockedAccess()`                                           |    warn     |
| [`prefer-undo-string`](docs/rules/prefer-undo-string.md)                           | Suggest providing a descriptive undo string for `executeTransaction()`                                  |    warn     |

### Type-checked rules

These rules require [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) and use TypeScript's type checker for accurate detection. Each rule replaces its syntactic counterpart.

| Rule                                                                                                         | Replaces                          | Description                                                                                                          | Recommended |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | :---------: |
| [`require-action-lock-scope-type-checked`](docs/rules/require-action-lock-scope-type-checked.md)             | `require-action-lock-scope`       | Require calls returning premierepro `Action` to be within `Project.lockedAccess()` or `Project.executeTransaction()` |    error    |
| [`require-execute-transaction-type-checked`](docs/rules/require-execute-transaction-type-checked.md)         | `require-execute-transaction`     | Require `CompoundAction.addAction()` calls to be within `Project.executeTransaction()`                               |    error    |
| [`no-async-in-locked-access-type-checked`](docs/rules/no-async-in-locked-access-type-checked.md)             | `no-async-in-locked-access`       | Disallow async operations inside `Project.lockedAccess()` callbacks                                                  |    error    |
| [`no-async-in-execute-transaction-type-checked`](docs/rules/no-async-in-execute-transaction-type-checked.md) | `no-async-in-execute-transaction` | Disallow async operations inside `Project.executeTransaction()` callbacks                                            |    error    |
| [`no-action-scope-escape-type-checked`](docs/rules/no-action-scope-escape-type-checked.md)                   | `no-action-scope-escape`          | Disallow premierepro `Action` objects from escaping their lock scope                                                 |    error    |
| [`prefer-locked-access-wrapper-type-checked`](docs/rules/prefer-locked-access-wrapper-type-checked.md)       | `prefer-locked-access-wrapper`    | Recommend wrapping `executeTransaction()` in `lockedAccess()` (type-checked)                                         |    warn     |
| [`prefer-undo-string-type-checked`](docs/rules/prefer-undo-string-type-checked.md)                           | `prefer-undo-string`              | Suggest providing a descriptive undo string for `Project.executeTransaction()` (type-checked)                        |    warn     |

### Which should I use?

- **JavaScript project or no typed linting** — use `recommended` (syntactic rules).
- **TypeScript project with typed linting** — use `recommendedTypeChecked` (type-checked rules). These replace the syntactic rules entirely; you do not need both.
- **Migrating** — you can enable both syntactic and type-checked rules during migration. They will not conflict, though you may see duplicate reports for the same issue.

## Configs

| Config                     | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `recommended`              | Syntactic rules with sensible defaults. Works in any project.      |
| `recommendedTypeChecked`   | Type-checked rules with sensible defaults. Requires typed linting. |
