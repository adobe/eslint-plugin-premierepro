# require-action-lock-scope

Require `create*Action()` calls to be within either a `Project.lockedAccess()` or `Project.executeTransaction()` callback.

## Rule Details

All `create*Action()` methods (e.g. `createMoveAction`, `createSetInPointAction`) require the project to be in a locked state. This can be achieved in two ways:

1. **`Project.lockedAccess()`** — the primary lock context for action creation. Keeps action creation separate from the transaction context.
2. **`Project.executeTransaction()`** — also provides a valid lock context. Actions can be created and added directly within the same transaction callback. However, nesting `executeTransaction()` inside `lockedAccess()` is the recommended pattern for clearer intent.

Calling `create*Action()` outside both of these contexts throws a runtime exception.

### Correct

Action created and used within `lockedAccess`:

```js
project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action);
  }, "Move clip");
});
```

Nested `executeTransaction` within `lockedAccess`:

```js
project.lockedAccess(() => {
  project.executeTransaction((compoundAction) => {
    const action = trackItem.createMoveAction(tickTime);
    compoundAction.addAction(action);
  }, "Move clip");
});
```

Action created within bare `executeTransaction` (valid but not recommended):

```js
project.executeTransaction((compoundAction) => {
  const action = trackItem.createMoveAction(tickTime);
  compoundAction.addAction(action);
}, "Move clip");
```

### Incorrect

Action created outside any lock context:

```js
// ✗ Will throw at runtime
const action = trackItem.createMoveAction(tickTime);

// ✗ Any regular function or callback outside lock contexts
function doStuff() {
  trackItem.createMoveAction(tickTime);
}
```

## Options

| Option          | Type     | Default             | Description                                              |
| --------------- | -------- | ------------------- | -------------------------------------------------------- |
| `actionPattern` | `string` | `^create\w+Action$` | Regex pattern for method names that require lock access. |

## Best Practice

While `executeTransaction()` alone provides a valid lock context, the recommended pattern is to wrap it inside `lockedAccess()`:

```js
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

## Known Limitations

The rule uses **lexical scope analysis** — it checks whether a `create*Action()` call appears textually inside a `lockedAccess` or `executeTransaction` callback. This means:

- **Helper functions defined inside the callback** are correctly allowed.
- **Helper functions defined outside and called inside** will be flagged (false positive), because the `create*Action()` call is not lexically within the callback. This is intentionally conservative — the call site should be wrapped, not just the caller.
- **Async escape hatches** like `setTimeout` or `Promise.then` callbacks that are lexically nested inside a lock callback will _not_ be flagged, even though the lock may have been released by the time they execute. See the [`no-async-in-locked-access`](./no-async-in-locked-access.md) rule for that.
