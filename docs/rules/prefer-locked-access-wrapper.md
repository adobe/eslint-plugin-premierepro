# prefer-locked-access-wrapper

Recommend wrapping `executeTransaction()` in `lockedAccess()` for clearer intent.

## Rule Details

While `project.executeTransaction()` provides a valid lock scope on its own (see [`require-action-lock-scope`](./require-action-lock-scope.md)), wrapping it inside `project.lockedAccess()` is the recommended pattern. This separation of concerns keeps action creation and transaction handling in distinct, clear scopes.

This rule emits a suggestion (not an error) when `executeTransaction()` is called at the top level without being wrapped in `lockedAccess()`.

### Correct

Recommended pattern: `executeTransaction` nested inside `lockedAccess`:

```js
project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action);
  }, "Move clip");
});
```

### Recommended Against

Bare `executeTransaction` without `lockedAccess` wrapper:

```js
// This is valid but less clear — consider wrapping in lockedAccess
project.executeTransaction((compoundAction) => {
  const action = trackItem.createMoveAction(tickTime);
  compoundAction.addAction(action);
}, "Move clip");
```

## Options

This rule has no options.

## When to Use

Use this rule if you want to enforce the recommended pattern of nesting `executeTransaction()` inside `lockedAccess()` across your codebase. It works well alongside the [`require-action-lock-scope`](./require-action-lock-scope.md) rule, which ensures actions are created within some lock context.

## Rationale

The nested pattern provides several benefits:

1. **Clear separation**: Action creation logic (inside `lockedAccess`) is visually separate from transaction handling (inside `executeTransaction`).
2. **Consistency**: Most complex workflows will naturally use this pattern anyway.
3. **Best practice**: Adobe's Premiere Pro samples and documentation recommend this approach.

However, bare `executeTransaction()` is _technically valid_ and this rule is only a suggestion, so teams can disable it if they prefer the simpler single-callback approach.
