# require-execute-transaction

Require `addAction()` calls to be within a `Project.executeTransaction()` callback.

## Rule Details

`CompoundAction.addAction()` is only valid inside the callback passed to `Project.executeTransaction()`. The `executeTransaction` method sets up the undoable transaction context that the compound action operates within. Calling `addAction()` outside this context will fail at runtime.

### Correct

```js
project.lockedAccess(() => {
  project.executeTransaction((compoundAction) => {
    const action = trackItem.createMoveAction(tickTime);
    compoundAction.addAction(action);
  }, "Move clip");
});
```

### Incorrect

```js
// ✗ addAction outside executeTransaction
project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  compoundAction.addAction(action);
});

// ✗ addAction in an unrelated callback
someApi.doSomething(() => {
  compoundAction.addAction(action);
});
```

## Options

This rule has no options.

## Known Limitations

The rule matches any `.addAction()` call by method name. If your codebase has unrelated APIs with an `addAction` method, you may see false positives. In practice this is rare, but you can disable the rule inline for those call sites.
