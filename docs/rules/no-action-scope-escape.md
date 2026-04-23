# no-action-scope-escape

Disallow action objects from escaping the lock scope they were created in (`lockedAccess()` or `executeTransaction()`).

## Rule Details

Actions created via `create*Action()` are only valid within the lock scope where they were created, either:
- Inside a `lockedAccess()` callback, or
- Inside an `executeTransaction()` callback

The locked state ensures the project model is consistent while the action is being built. Once the lock is released (i.e. the callback returns), the action object becomes stale. Using it in a later `lockedAccess()` call, or holding onto it for later use, will cause runtime errors or silently corrupt project state.

The rule detects when a `create*Action()` return value is assigned to a variable that was declared **outside** the current lock callback, which is the primary mechanism by which actions escape their scope.

### Correct

Action created and consumed in the same `lockedAccess` scope:

```js
project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action);
  }, "Move clip");
});
```

Action created and consumed within the same `executeTransaction` scope:

```js
project.executeTransaction((compoundAction) => {
  const action = trackItem.createMoveAction(tickTime);
  compoundAction.addAction(action);
}, "Move clip");
```

### Incorrect

Action escapes to an outer variable:

```js
// ✗ Declared outside lock scope
let action;
project.lockedAccess(() => {
  action = trackItem.createMoveAction(tickTime);
});

// Sometime later — action is stale, lock no longer held
project.lockedAccess(() => {
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action); // Runtime error or corruption
  }, "Move clip");
});
```

Action stored on an external object:

```js
// ✗ Stored on external object
const state = {};
project.lockedAccess(() => {
  state.pendingAction = trackItem.createMoveAction(tickTime);
});
```

Action created in one lock scope and used in another:

```js
// ✗ Created in executeTransaction, but variable declared outside
let moveAction;
project.executeTransaction((compoundAction) => {
  moveAction = trackItem.createMoveAction(tickTime);
}, "Move");

// Later — this action is stale
project.lockedAccess(() => {
  project.executeTransaction((ca) => {
    ca.addAction(moveAction); // Runtime error
  }, "Another edit");
});
```

## Options

This rule has no options.

## Conservative Checking Strategy

This rule uses **conservative scope analysis** and will flag any action value assigned to a variable or property declared outside the lock scope, even if the value is only used within locks in practice.

This intentionally aggressive approach prevents accidental misuse—the variable declaration itself creates an escape route, and even if your current code uses it safely, future maintainers might not.

**If you're confident a pattern is safe**, you can:
- Disable the rule inline: `// eslint-disable-next-line @adobe/premierepro/no-action-scope-escape`
- Disable it for a file or project if your usage pattern differs
- Consider restructuring to declare the variable inside the lock scope when possible

## Known Limitations

The rule uses **static scope analysis** — it checks whether the assignment target was declared inside or outside the lock callback. This means:

- **Simple assignments** (`action = create*Action()`) and **property assignments** (`obj.prop = create*Action()`) are detected.
- **Indirect escapes**--such as passing actions through function calls, `Array.push()`, `Map.set()`, or returning from the callback--are not currently detected. These patterns are less common but could be added in future versions.
- Actions created **outside** any lock context are caught by the [`require-action-lock-scope`](./require-action-lock-scope.md) rule instead.

