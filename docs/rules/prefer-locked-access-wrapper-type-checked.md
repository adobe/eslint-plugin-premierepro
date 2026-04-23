# prefer-locked-access-wrapper-type-checked

Recommend wrapping `executeTransaction()` in `lockedAccess()` for clearer intent (type-checked variant).

This is the **type-checked** variant of [`prefer-locked-access-wrapper`](./prefer-locked-access-wrapper.md).

## Rule Details

While `project.executeTransaction()` provides a valid lock scope on its own, wrapping it inside `project.lockedAccess()` is the recommended pattern for clearer code organization and intent.

This rule emits a suggestion (not an error) when `executeTransaction()` is called at the top level without being wrapped in `lockedAccess()`.

### Correct

Recommended pattern: `executeTransaction` nested inside `lockedAccess`:

```ts
import { Project } from "@adobe/premierepro";
declare const project: Project;

project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action);
  }, "Move clip");
});
```

### Recommended Against

Bare `executeTransaction` without `lockedAccess` wrapper:

```ts
// This is valid but less clear — consider wrapping in lockedAccess
project.executeTransaction((compoundAction) => {
  const action = trackItem.createMoveAction(tickTime);
  compoundAction.addAction(action);
}, "Move clip");
```

## Options

This rule has no options.

## When to Use

Use this rule if your project has TypeScript and typed linting configured. It provides the same recommendation as the syntactic variant with more precise detection.

## Requirements

This rule requires [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) to be configured.
