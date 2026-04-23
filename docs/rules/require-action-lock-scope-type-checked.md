# require-action-lock-scope-type-checked

Require calls that return a premierepro `Action` to be within either a `Project.lockedAccess()` or `Project.executeTransaction()` callback.

This is the **type-checked** variant of [`require-action-lock-scope`](./require-action-lock-scope.md). Instead of matching method names by regex, it uses the TypeScript type checker to verify that a call actually returns an `Action` from `@adobe/premierepro`. This eliminates false positives from unrelated methods and catches wrapper functions the syntactic rule would miss.

## Rule Details

Any function call whose return type is `Action` from `@adobe/premierepro` must appear inside either a `lockedAccess()` or `executeTransaction()` callback. This includes both direct calls like `trackItem.createMoveAction()` and wrapper functions that return `Action`.

Both lock contexts are valid:

1. **`Project.lockedAccess()`** — recommended primary lock context
2. **`Project.executeTransaction()`** — also valid but typically nested inside `lockedAccess()` for clearer intent

### Correct

Direct Action-returning call inside `lockedAccess`:

```ts
import { Project } from "@adobe/premierepro";
declare const project: Project;

project.lockedAccess(() => {
  project.executeTransaction((compoundAction) => {
    const action = trackItem.createMoveAction(tickTime);
    compoundAction.addAction(action);
  }, "Move clip");
});
```

Nested `executeTransaction` within `lockedAccess`:

```ts
project.lockedAccess(() => {
  project.executeTransaction((compoundAction) => {
    const action = trackItem.createMoveAction(tickTime);
    compoundAction.addAction(action);
  }, "Move clip");
});
```

Bare `executeTransaction` (valid but not recommended):

```ts
project.executeTransaction((compoundAction) => {
  const action = trackItem.createMoveAction(tickTime);
  compoundAction.addAction(action);
}, "Move clip");
```

Non-premierepro function with a similar name -- not flagged:

```ts
type MyAction = { type: string };
function createFooAction(): MyAction {
  return { type: "foo" };
}
createFooAction();
```

### Incorrect

Direct call outside lock contexts:

```ts
import { Project, Action } from "@adobe/premierepro";

// ✗ Will throw at runtime
trackItem.createMoveAction(tickTime);

// ✗ Inside a regular function
function doStuff(): Action {
  return trackItem.createMoveAction(tickTime);
}

// ✗ Called outside lock contexts
doStuff();
```

## Options

This rule has no options. Unlike the syntactic variant, there is no `actionPattern` option -- the type checker determines which calls return `Action`.

## Best Practice

While `executeTransaction()` alone provides a valid lock context, the recommended pattern is to wrap it inside `lockedAccess()`:

```ts
// RECOMMENDED: Clear separation of concerns
project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action);
  }, "My Undo String");
});

// VALID, but less clear: All in one place
project.executeTransaction((compoundAction) => {
  const action = trackItem.createMoveAction(tickTime);
  compoundAction.addAction(action);
}, "My Undo String");
```

To enforce this best practice, consider using the [`prefer-locked-access-wrapper`](./prefer-locked-access-wrapper.md) rule (when available).

## When to Use

Use this rule instead of `require-action-lock-scope` when your project has TypeScript and type information configured in ESLint. It provides the same protection with fewer false positives and catches wrapper functions the syntactic rule misses.

## Requirements

This rule requires [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) to be configured.
